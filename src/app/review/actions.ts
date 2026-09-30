"use server";

import { revalidatePath } from "next/cache";

import {
  MAX_REVIEW_CONFIDENCE,
  MAX_REVIEW_THOUGHT_LENGTH,
  MIN_REVIEW_CONFIDENCE,
  MIN_REVIEW_THOUGHT_LENGTH,
  isProblemStatus,
} from "@/lib/constants";
import {
  getProblem,
  insertReview,
  listNotes,
  listReviews,
  listSolutions,
  listThinkingSessions,
  listVisualizations,
  updateProblemStatusById,
} from "@/lib/db";
import {
  nextReviewAt,
  stepFromReviews,
  wholeDaysSince,
} from "@/lib/spaced-repetition";
import type {
  ProblemStatus,
  Review,
  ReviewField,
  ReviewFormState,
  ReviewRevealState,
  ReviewRevealedSession,
  ThinkingSession,
} from "@/types";

/**
 * Review mutations.
 *
 * The shape follows the rest of the app: every export of a `"use server"` file
 * must be async, so the form-facing action takes the `useActionState` shape
 * `(prevState, formData)` and answers with a serializable state object. The
 * `problemId` travels in a hidden field and is re-checked against D1 before
 * anything is written, and the status change rides the same payload rather
 * than a second round-trip.
 *
 * `loadReviewReveal` is the other half of the feature and the reason this file
 * exists as more than an insert: a review only means something if the attempt
 * is made *before* the notes are visible, so the hidden half of a problem —
 * the past thinking, the notes, the solution, the drawings — is fetched here,
 * on demand, instead of being shipped in the page's payload where it would sit
 * in the HTML waiting to be peeked at.
 */

/** Every route a written review changes what it shows. */
function revalidateReviewPaths(problemId: string) {
  revalidatePath("/review");
  revalidatePath(`/review/${problemId}`);
  revalidatePath(`/problems/${problemId}`);
  revalidatePath("/");
}

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function reviewError(
  message: string,
  fieldErrors: Partial<Record<ReviewField, string>> = {}
): ReviewFormState {
  return { status: "error", message, fieldErrors };
}

/**
 * Which past thinking session a review is compared against.
 *
 * Never reviewed → the very first session, because that is the reasoning this
 * problem was first met with. Already reviewed → the last session that happened
 * *before* the newest review, so the comparison is against the thinking that
 * was actually fresh at the time. `listThinkingSessions` returns newest first,
 * so the first match of that filter is the one, and the oldest session is the
 * fallback when every session came later.
 */
function pickRecallSession(
  sessions: ThinkingSession[],
  reviews: Review[]
): ReviewRevealedSession | null {
  if (!sessions.length) return null;

  const lastReviewedAt = reviews[0]?.reviewed_at;
  const picked = lastReviewedAt
    ? sessions.find((session) => session.started_at <= lastReviewedAt) ??
      sessions[sessions.length - 1]
    : sessions[sessions.length - 1];

  // Reduce the row to what the compare phase needs. Only one session crosses the
  // wire here, and the recall phase never gets this shape at all.
  return {
    id: picked.id,
    startedAt: picked.started_at,
    durationSeconds: picked.duration_seconds,
    thoughts: picked.thoughts,
  };
}

/**
 * Save one finished review: the attempt written from memory, how it went, and
 * when it comes back.
 *
 * Validation is deliberately unforgiving about `thoughts` — twenty characters is
 * the floor, because a review where you peek first and think second teaches
 * nothing and quietly produces a long row of confident-looking history. The
 * confidence has to be a whole 1–5: it is what the scheduler keys off, so a
 * missing or invented value would silently mis-schedule the problem.
 */
export async function saveReview(
  _prevState: ReviewFormState,
  formData: FormData
): Promise<ReviewFormState> {
  const problemId = text(formData, "problemId");
  if (!problemId) {
    return reviewError("Missing problem id — reopen the problem and try again.");
  }

  const problem = await getProblem(problemId);
  if (!problem) {
    return reviewError("That problem no longer exists.");
  }

  const fieldErrors: Partial<Record<ReviewField, string>> = {};

  const thoughts = text(formData, "thoughts");
  if (thoughts.length < MIN_REVIEW_THOUGHT_LENGTH) {
    fieldErrors.thoughts = `Write at least ${MIN_REVIEW_THOUGHT_LENGTH} characters — the attempt comes before the notes.`;
  } else if (thoughts.length > MAX_REVIEW_THOUGHT_LENGTH) {
    fieldErrors.thoughts = `Keep it under ${MAX_REVIEW_THOUGHT_LENGTH} characters.`;
  }

  const rawConfidence = text(formData, "confidence");
  const confidence = Number(rawConfidence);
  if (
    !/^\d+$/.test(rawConfidence) ||
    !Number.isInteger(confidence) ||
    confidence < MIN_REVIEW_CONFIDENCE ||
    confidence > MAX_REVIEW_CONFIDENCE
  ) {
    fieldErrors.confidence = `Pick how it went, from ${MIN_REVIEW_CONFIDENCE} to ${MAX_REVIEW_CONFIDENCE}.`;
  }

  // Only sent when the user moved the status, so an untouched review can never
  // overwrite a status they did not mean to change.
  const rawStatus = text(formData, "status");
  if (rawStatus && !isProblemStatus(rawStatus)) {
    fieldErrors.status = "Pick one of the five statuses.";
  }

  if (Object.keys(fieldErrors).length) {
    return reviewError("Fix the highlighted fields and try again.", fieldErrors);
  }

  const reviews = await listReviews(problemId);
  const currentStep = stepFromReviews(reviews);
  const previous = reviews[0];
  const elapsedDays = previous ? wholeDaysSince(previous.reviewed_at) : null;
  const schedule = nextReviewAt(confidence, currentStep);

  const reviewId = await insertReview({
    problemId,
    thoughts,
    confidence,
    elapsedDays,
    nextReviewAt: schedule.date,
  });

  if (rawStatus && rawStatus !== problem.status) {
    await updateProblemStatusById(problemId, rawStatus as ProblemStatus);
  }

  revalidateReviewPaths(problemId);

  return {
    status: "success",
    reviewId,
    step: schedule.step,
    intervalDays: schedule.intervalDays,
    nextReviewAt: schedule.date,
    elapsedDays,
  };
}

/**
 * Hand back the half of a problem a review hides — the past thinking session,
 * the notes, the solution, and the drawings — once the user has committed
 * their own attempt.
 *
 * Read-only, so it revalidates nothing; the reveal is a client state change and
 * nothing on the server has moved. A problem with no thinking session gets an
 * empty `session` and a sentence that says so, rather than a blank panel.
 */
export async function loadReviewReveal(
  _prevState: ReviewRevealState,
  problemId: string
): Promise<ReviewRevealState> {
  const id = typeof problemId === "string" ? problemId.trim() : "";
  if (!id) {
    return { status: "error", reveal: null, message: "Missing problem id." };
  }

  const problem = await getProblem(id);
  if (!problem) {
    return { status: "error", reveal: null, message: "That problem no longer exists." };
  }

  const [sessions, reviews, notes, solutions, visualizations] = await Promise.all([
    listThinkingSessions(id),
    listReviews(id),
    listNotes(id),
    listSolutions(id),
    listVisualizations(id),
  ]);

  const session = pickRecallSession(sessions, reviews);

  return {
    status: "ready",
    reveal: {
      session,
      notes,
      solutions,
      visualizations,
      message: session
        ? reviews.length
          ? "The thinking you did the last time this problem came round."
          : "Your first thinking session on this problem, from the very first time you met it."
        : "No thinking session was saved for this problem, so there is nothing to compare against yet.",
    },
  };
}
