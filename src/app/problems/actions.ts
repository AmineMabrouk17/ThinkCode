"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  DEFAULT_CATEGORY,
  DEFAULT_PLATFORM,
  MAX_DESCRIPTION_LENGTH,
  MAX_SHORT_LENGTH,
  MAX_TAGS,
  MAX_TAG_LENGTH,
  MAX_THOUGHTS_LENGTH,
  MAX_TITLE_LENGTH,
  MIN_THINKING_SECONDS,
  isDifficulty,
  isProblemStatus,
} from "@/lib/constants";
import {
  deleteProblemById,
  deleteThinkingSession,
  getProblem,
  insertProblem,
  insertThinkingSession,
  updateProblemById,
  updateProblemStatusById,
} from "@/lib/db";
import type {
  ProblemField,
  ProblemFormState,
  ProblemInput,
  ProblemStatus,
  ThinkingSessionFormState,
} from "@/types";

/**
 * Problem mutations.
 *
 * Every export of a `"use server"` file must be an async function, so the
 * form-facing actions take the `useActionState` shape
 * `(prevState, formData)` and return a serializable {@link ProblemFormState}.
 * The `problemId` travels in a hidden field and is re-validated against D1
 * before anything is written. After each mutation the affected routes are
 * revalidated, which ships a fresh RSC payload in the same response.
 */

/** The action response, keyed by every route that renders problems. */
function revalidateProblemPaths(problemId?: string) {
  revalidatePath("/problems");
  revalidatePath("/");
  if (problemId) revalidatePath(`/problems/${problemId}`);
}

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function list(formData: FormData, key: string): string[] {
  return formData
    .getAll(key)
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean);
}

/**
 * Validate and normalize raw `FormData` into a {@link ProblemInput}. Returns
 * `null` plus per-field messages when the payload is not usable.
 */
function parseProblemInput(formData: FormData): {
  input: ProblemInput | null;
  fieldErrors: Partial<Record<ProblemField, string>>;
} {
  const fieldErrors: Partial<Record<ProblemField, string>> = {};

  const title = text(formData, "title");
  if (!title) {
    fieldErrors.title = "A title is required.";
  } else if (title.length > MAX_TITLE_LENGTH) {
    fieldErrors.title = `Keep the title under ${MAX_TITLE_LENGTH} characters.`;
  }

  const platform = text(formData, "platform").slice(0, MAX_SHORT_LENGTH);
  if (platform.length > MAX_SHORT_LENGTH) {
    fieldErrors.platform = `Keep the platform under ${MAX_SHORT_LENGTH} characters.`;
  }

  const category = text(formData, "category").slice(0, MAX_SHORT_LENGTH);
  if (category.length > MAX_SHORT_LENGTH) {
    fieldErrors.category = `Keep the category under ${MAX_SHORT_LENGTH} characters.`;
  }

  const externalUrl = text(formData, "externalUrl");
  if (externalUrl && !/^https?:\/\/[^\s]+$/i.test(externalUrl)) {
    fieldErrors.externalUrl = "Use a full URL starting with http:// or https://";
  }

  const difficulty = text(formData, "difficulty");
  if (!isDifficulty(difficulty)) {
    fieldErrors.difficulty = "Pick Easy, Medium, or Hard.";
  }

  const status = text(formData, "status");
  if (!isProblemStatus(status)) {
    fieldErrors.status = "Pick one of the five statuses.";
  }

  const description = text(formData, "description");
  if (description.length > MAX_DESCRIPTION_LENGTH) {
    fieldErrors.description = `Keep the description under ${MAX_DESCRIPTION_LENGTH} characters.`;
  }

  const tags = list(formData, "tags")
    .map((tag) => tag.slice(0, MAX_TAG_LENGTH))
    .slice(0, MAX_TAGS);
  if (list(formData, "tags").length > MAX_TAGS) {
    fieldErrors.tags = `Pick at most ${MAX_TAGS} tags.`;
  }

  if (Object.keys(fieldErrors).length) {
    return { input: null, fieldErrors };
  }

  return {
    fieldErrors,
    input: {
      title,
      platform: platform || DEFAULT_PLATFORM,
      externalUrl: externalUrl || null,
      difficulty: difficulty as ProblemInput["difficulty"],
      category: category || DEFAULT_CATEGORY,
      status: status as ProblemInput["status"],
      description: description || null,
      patternIds: list(formData, "patternIds"),
      tags,
    },
  };
}

function errorState(
  message: string,
  fieldErrors: Partial<Record<ProblemField, string>> = {}
): ProblemFormState {
  return { status: "error", message, fieldErrors };
}

/** Create a problem from the library form. */
export async function createProblem(
  _prevState: ProblemFormState,
  formData: FormData
): Promise<ProblemFormState> {
  const { input, fieldErrors } = parseProblemInput(formData);
  if (!input) {
    return errorState("Fix the highlighted fields and try again.", fieldErrors);
  }

  const id = await insertProblem(input);

  revalidateProblemPaths(id);

  return { status: "success", problemId: id };
}

/** Update a problem from the detail page form. */
export async function updateProblem(
  _prevState: ProblemFormState,
  formData: FormData
): Promise<ProblemFormState> {
  const problemId = text(formData, "problemId");
  if (!problemId) {
    return errorState("Missing problem id — reopen the problem and try again.");
  }

  const { input, fieldErrors } = parseProblemInput(formData);
  if (!input) {
    return errorState("Fix the highlighted fields and try again.", fieldErrors);
  }

  const updated = await updateProblemById(problemId, input);
  if (!updated) {
    return errorState("That problem no longer exists.");
  }

  revalidateProblemPaths(problemId);

  return { status: "success", problemId };
}

/** Delete a problem and everything attached to it, then go back to /problems. */
export async function deleteProblem(problemId: string): Promise<void> {
  const id = problemId?.trim();
  if (!id) {
    throw new Error("deleteProblem: a problem id is required");
  }

  const deleted = await deleteProblemById(id);
  if (!deleted) {
    throw new Error(`deleteProblem: no problem with id ${id}`);
  }

  revalidateProblemPaths(id);
  redirect("/problems");
}

/** Header quick-switch: change a problem's status without opening the form. */
export async function setProblemStatus(
  problemId: string,
  status: ProblemStatus
): Promise<{ ok: boolean; error?: string }> {
  const id = problemId?.trim();
  if (!id) return { ok: false, error: "Missing problem id." };
  if (!isProblemStatus(String(status))) {
    return { ok: false, error: "Unknown status." };
  }

  const updated = await updateProblemStatusById(id, status);
  if (!updated) return { ok: false, error: "That problem no longer exists." };

  revalidateProblemPaths(id);

  return { ok: true };
}

// ---- thinking sessions -------------------------------------------

/**
 * `2026-08-15T09:00:00.000Z` -> `2026-08-15 09:00:00`, the UTC shape D1 stores
 * and `formatDateTime` renders. Unparseable values fall back to now, so a
 * broken client clock can never write a row that cannot be sorted.
 */
function sqlTimestamp(value: string): string {
  const date = new Date(value);
  const safe = Number.isNaN(date.getTime()) ? new Date() : date;
  return safe.toISOString().slice(0, 19).replace("T", " ");
}

function thinkingError(message: string): ThinkingSessionFormState {
  return { status: "error", message };
}

/**
 * Store a finished thinking session from the timer.
 *
 * The timer is the only writer, so the payload is small and fully trusted:
 * the problem is re-checked against D1, the duration is floored at
 * `MIN_THINKING_SECONDS` so an accidental instant finish is never recorded, and
 * the thoughts are trimmed and capped. Only the problem route is revalidated —
 * the dashboard shows no session data.
 */
export async function saveThinkingSession(
  _prevState: ThinkingSessionFormState,
  formData: FormData
): Promise<ThinkingSessionFormState> {
  const problemId = text(formData, "problemId");
  if (!problemId) {
    return thinkingError("Missing problem id — reopen the problem and try again.");
  }

  const problem = await getProblem(problemId);
  if (!problem) {
    return thinkingError("That problem no longer exists.");
  }

  const durationSeconds = Math.round(Number(text(formData, "durationSeconds")));
  if (!Number.isFinite(durationSeconds) || durationSeconds < MIN_THINKING_SECONDS) {
    return thinkingError(
      `Keep thinking for at least ${MIN_THINKING_SECONDS} seconds before saving.`
    );
  }

  const thoughts = text(formData, "thoughts").slice(0, MAX_THOUGHTS_LENGTH);

  const sessionId = await insertThinkingSession({
    problemId,
    durationSeconds,
    startedAt: sqlTimestamp(text(formData, "startedAt")),
    endedAt: sqlTimestamp(text(formData, "endedAt")),
    thoughts: thoughts || null,
  });

  revalidatePath(`/problems/${problemId}`);

  return { status: "success", sessionId };
}

/** Delete one session from the THINK section history. */
export async function deleteThinkingSessionAction(
  problemId: string,
  sessionId: string
): Promise<{ ok: boolean; error?: string }> {
  const problem = problemId?.trim();
  const id = sessionId?.trim();
  if (!problem || !id) {
    return { ok: false, error: "Missing problem or session id." };
  }

  const deleted = await deleteThinkingSession(id, problem);
  if (!deleted) {
    return { ok: false, error: "That thinking session no longer exists." };
  }

  revalidatePath(`/problems/${problem}`);

  return { ok: true };
}
