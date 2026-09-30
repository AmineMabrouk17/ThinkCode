import type { Review } from "@/types";

/**
 * Spaced repetition for the review system.
 *
 * The README fixes the schedule at Day 1, 3, 7, 14 and 30, with the note that
 * "the intervals can later become adaptive based on review performance". This
 * is that first version: pure functions, no DB and no React, so the client —
 * which shows the consequence of a confidence score *before* saving — and the
 * server — which decides what `next_review_at` actually is — can share one
 * implementation and never disagree about when a problem comes back.
 */

/** The schedule, in days. Rung 0 is "come back tomorrow". */
export const REVIEW_INTERVAL_DAYS = [1, 3, 7, 14, 30] as const;

/** The rung a problem is on when it has never been reviewed. */
export const NO_REVIEW_YET = -1;

/** Human names for the rungs, used under the picker and on the session page. */
const RUNG_LABELS = [
  "Day 1",
  "Day 3",
  "Day 7",
  "Day 14",
  "Day 30",
] as const;

/** Clamp anything into a whole number inside `min..max`. */
function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.round(value)));
}

/** `1` -> `"1 day"`, `7` -> `"7 days"`. */
export function formatInterval(days: number): string {
  return days === 1 ? "1 day" : `${days} days`;
}

/** Parse a D1 timestamp (`YYYY-MM-DD HH:MM:SS`, UTC) into a Date. */
function parseSqlDate(value: string): Date | null {
  const date = new Date(value.includes("T") ? value : `${value.replace(" ", "T")}Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** `YYYY-MM-DD HH:MM:SS` in UTC — the shape D1 stores and `formatDate` reads. */
function toSqlDate(date: Date): string {
  return date.toISOString().slice(0, 19).replace("T", " ");
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Which rung comes next.
 *
 * - confidence 1–2 (couldn't start, or needed the old answer): back to Day 1. A
 *   bad review is information; pretending otherwise is how spaced repetition
 *   turns into a box-ticking ritual.
 * - confidence 3 (would get there, slowly): hold the current rung. Jumping the
 *   queue on a shaky attempt is how you meet the same problem in a month with
 *   no memory of it at all.
 * - confidence 4–5: advance one rung, capped at Day 30. A first-ever review
 *   jumps to Day 3, because the user has just proved they can solve it today.
 */
export function nextReviewStep(confidence: number, currentStep: number): number {
  const score = clamp(confidence, 1, 5);
  const current = clamp(currentStep, NO_REVIEW_YET, REVIEW_INTERVAL_DAYS.length - 1);
  const last = REVIEW_INTERVAL_DAYS.length - 1;

  if (score <= 2) return 0;
  if (score === 3) return Math.max(0, current);
  return current < 0 ? Math.min(1, last) : Math.min(current + 1, last);
}

/**
 * The whole decision in one call: the next rung, the gap in days, and the
 * `next_review_at` string to store.
 */
export function nextReviewAt(
  confidence: number,
  currentStep: number,
  from: Date = new Date()
): { step: number; intervalDays: number; date: string } {
  const step = nextReviewStep(confidence, currentStep);
  const intervalDays = REVIEW_INTERVAL_DAYS[step];
  const date = new Date(from.getTime() + intervalDays * DAY_MS);

  return { step, intervalDays, date: toSqlDate(date) };
}

/**
 * Recover the rung a stored review used, from the gap between `reviewed_at` and
 * the `next_review_at` it scheduled.
 *
 * This is how the server rebuilds "where in the schedule is this problem"
 * without adding a column: the schedule the review chose is already in the row,
 * so the row is the history. Anything unrecognised (a hand-edited date, a row
 * from before the ladder was this length) falls back to the gap in days rather
 * than pretending the problem is on Day 1.
 */
export function stepFromSchedule(
  reviewedAt: string | null,
  nextReviewAt: string | null
): number {
  if (!reviewedAt || !nextReviewAt) return NO_REVIEW_YET;

  const from = parseSqlDate(reviewedAt);
  const to = parseSqlDate(nextReviewAt);
  if (!from || !to) return NO_REVIEW_YET;

  const days = Math.round((to.getTime() - from.getTime()) / DAY_MS);
  const index = (REVIEW_INTERVAL_DAYS as readonly number[]).indexOf(days);

  return index === -1
    ? clamp(days, 0, REVIEW_INTERVAL_DAYS.length - 1)
    : index;
}

/**
 * The rung a problem is currently on, from its review history (newest first).
 * `NO_REVIEW_YET` when the problem has never been reviewed.
 */
export function stepFromReviews(reviews: Pick<Review, "reviewed_at" | "next_review_at">[]): number {
  const newest = reviews[0];
  if (!newest) return NO_REVIEW_YET;

  return stepFromSchedule(newest.reviewed_at, newest.next_review_at);
}

/**
 * Whole days between a stored timestamp and now, floored so a review logged
 * this morning reads as "0 days later" rather than "-0". Null when the
 * timestamp is missing or unparseable.
 */
export function wholeDaysSince(
  value: string | null,
  now: Date = new Date()
): number | null {
  if (!value) return null;

  const from = parseSqlDate(value);
  if (!from) return null;

  return Math.max(0, Math.floor((now.getTime() - from.getTime()) / DAY_MS));
}

/**
 * The signed version: negative for a date still in the future, `0` for today,
 * positive for overdue. Null when the timestamp cannot be read.
 *
 * `wholeDaysSince` clamps at zero, which is right for "how long since I last
 * did this" and wrong for "when does this come back" — a schedule three days
 * out would read as "0 days since", i.e. due now. The queue and the review
 * history both need to tell those apart.
 */
export function daysUntil(value: string | null, now: Date = new Date()): number | null {
  if (!value) return null;

  const to = parseSqlDate(value);
  if (!to) return null;

  return Math.floor((to.getTime() - now.getTime()) / DAY_MS);
}

/**
 * A quiet sentence explaining the schedule a score earned. Shown live under the
 * confidence picker, so the consequence is visible before committing — and, just
 * as importantly, so a low score reads as "closer, not further" rather than as a
 * punishment.
 */
export function describeInterval(confidence: number, currentStep: number): string {
  const score = clamp(confidence, 1, 5);
  const { intervalDays } = nextReviewAt(score, currentStep);

  if (score <= 2) {
    return `You had to reach for the old answer. This comes back in ${formatInterval(
      intervalDays
    )} — closer, not further.`;
  }
  if (score === 3) {
    return `It is there, but slowly. Staying on ${formatInterval(
      intervalDays
    )} is the honest call.`;
  }
  return `It held up without the notes. Next time in ${formatInterval(intervalDays)}.`;
}

/**
 * `"Day 3"`, or `"no schedule yet"` for a problem that has never been reviewed.
 * Returns a short noun phrase so it reads correctly mid-sentence ("Currently
 * Day 3 spacing").
 */
export function reviewLadderLabel(step: number): string {
  if (!Number.isFinite(step) || step < 0) return "no schedule yet";
  const index = clamp(step, 0, REVIEW_INTERVAL_DAYS.length - 1);

  return RUNG_LABELS[index];
}
