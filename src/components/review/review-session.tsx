"use client";

import Link from "next/link";
import { startTransition, useActionState, useId, useRef, useState } from "react";

import { loadReviewReveal, saveReview } from "@/app/review/actions";
import { Markdown } from "@/components/knowledge/markdown";
import { NoteTypeBadge } from "@/components/knowledge/note-type-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { MermaidDiagram } from "@/components/visualizations/mermaid-diagram";
import {
  MAX_REVIEW_CONFIDENCE,
  MAX_REVIEW_THOUGHT_LENGTH,
  MIN_REVIEW_CONFIDENCE,
  MIN_REVIEW_THOUGHT_LENGTH,
  NOTE_TYPES,
  NOTE_TYPE_EMOJI,
  NOTE_TYPE_LABELS,
  PROBLEM_STATUSES,
  REVIEW_CONFIDENCE_LABELS,
  STATUS_LABELS,
  VISUALIZATION_TYPE_EMOJI,
} from "@/lib/constants";
import { describeInterval, reviewLadderLabel } from "@/lib/spaced-repetition";
import { codeFence, languageLabel } from "@/lib/solution-utils";
import { formatDate, formatDateTime, formatSessionDuration } from "@/lib/utils";
import { visualizationBadgeLabel, visualizationImageHost } from "@/lib/visualization-utils";
import type {
  Problem,
  ReviewFormState,
  ReviewPastSession,
  ReviewRevealState,
} from "@/types";

const INITIAL_REVIEW_STATE: ReviewFormState = { status: "idle" };
const INITIAL_REVEAL_STATE: ReviewRevealState = { status: "idle", reveal: null };

const CONFIDENCE_OPTIONS = Array.from(
  { length: MAX_REVIEW_CONFIDENCE - MIN_REVIEW_CONFIDENCE + 1 },
  (_, index) => MIN_REVIEW_CONFIDENCE + index
);

const RECALL_PLACEHOLDER =
  "# Two Sum, from memory.\n# What data structure would I reach for first, and why?";

/**
 * A review session, in two phases.
 *
 * The product rule lives here: **nothing you wrote before may be visible until
 * you have written something now.** Phase 1 shows the problem and a blank
 * textarea and, at most, the fact that past sessions existed — when they
 * happened, how long they ran, never a word of what they said. Phase 2, the
 * compare, is the only place old thinking, notes, the solution, and the
 * drawings are rendered.
 *
 * The hidden half is deliberately *not* a prop. Passing it down and simply not
 * rendering it would leave the notes, the solution code, and the old thinking
 * sitting in the page's RSC payload — present in the HTML, one `curl` and one
 * search away, which is exactly the peek this flow exists to prevent. So the
 * compare is a server round-trip (`loadReviewReveal`) fired from the reveal
 * click, and the reveal itself is client state that never round-trips.
 */
export function ReviewSession({
  problem,
  pastSessions,
  currentStep,
  reviewCount,
  lastReviewedAt,
  nextReviewAt,
}: {
  problem: Problem;
  /** Dates and durations only — the thoughts are fetched at reveal time. */
  pastSessions: ReviewPastSession[];
  /** Ladder rung derived from the review history (see `stepFromReviews`). */
  currentStep: number;
  reviewCount: number;
  lastReviewedAt: string | null;
  nextReviewAt: string | null;
}) {
  const [state, formAction, pending] = useActionState(
    saveReview,
    INITIAL_REVIEW_STATE
  );
  const [revealState, revealAction, revealPending] = useActionState(
    loadReviewReveal,
    INITIAL_REVEAL_STATE
  );

  const [phase, setPhase] = useState<"recall" | "compare">("recall");
  const [thoughts, setThoughts] = useState("");
  const [confidence, setConfidence] = useState<number | null>(null);
  const [statusAfter, setStatusAfter] = useState(problem.status);

  const saved = state.status === "success";
  const canReveal = thoughts.trim().length > 0;
  const statusChanged = statusAfter !== problem.status;

  /** Phase 2 always needs the hidden half; fetch it exactly once, on reveal. */
  function reveal() {
    if (!canReveal) return;
    startTransition(() => {
      setPhase("compare");
      revealAction(problem.id);
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <form action={formAction} className="flex flex-col gap-5">
        <input type="hidden" name="problemId" value={problem.id} />

        {phase === "compare" ? (
          <>
            {/* The attempt is submitted from the form in phase 2, and the
                textarea that held it is gone by then — so the text travels in
                a hidden field instead. */}
            <input type="hidden" name="thoughts" value={thoughts} />
            <input type="hidden" name="confidence" value={confidence ?? ""} />
            {statusChanged ? (
              <input type="hidden" name="status" value={statusAfter} />
            ) : null}
          </>
        ) : null}

        {phase === "recall" ? (
          <RecallPhase
            problem={problem}
            pastSessions={pastSessions}
            reviewCount={reviewCount}
            lastReviewedAt={lastReviewedAt}
            nextReviewAt={nextReviewAt}
            thoughts={thoughts}
            canReveal={canReveal}
            onThoughts={setThoughts}
            onReveal={reveal}
          />
        ) : (
          <>
            <ComparePhase
              thoughts={thoughts}
              revealState={revealState}
              revealPending={revealPending}
            />

            {saved ? null : (
              <ScorePhase
                confidence={confidence}
                currentStep={currentStep}
                status={statusAfter}
                onConfidence={setConfidence}
                onStatus={setStatusAfter}
                pending={pending}
                fieldErrors={state.fieldErrors ?? {}}
                message={state.status === "error" ? state.message : undefined}
              />
            )}
          </>
        )}

        {state.status === "error" && phase === "recall" && state.message ? (
          <p role="alert" className="text-sm text-rose-400">
            {state.message}
          </p>
        ) : null}
      </form>

      {saved ? <Confirmation state={state} problemId={problem.id} /> : null}
    </div>
  );
}

// ---- phase 1: recall ------------------------------------------------

function RecallPhase({
  problem,
  pastSessions,
  reviewCount,
  lastReviewedAt,
  nextReviewAt,
  thoughts,
  canReveal,
  onThoughts,
  onReveal,
}: {
  problem: Problem;
  pastSessions: ReviewPastSession[];
  reviewCount: number;
  lastReviewedAt: string | null;
  nextReviewAt: string | null;
  thoughts: string;
  canReveal: boolean;
  onThoughts: (value: string) => void;
  onReveal: () => void;
}) {
  const thoughtsId = useId();

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="flex flex-col gap-3 py-5">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-widest text-accent">
            <span>Step 1 of 2</span>
            <span aria-hidden>·</span>
            <span className="text-muted">Recall</span>
          </div>
          <p className="text-sm leading-relaxed text-ink">
            Before you look at anything you wrote before — how would you solve{" "}
            <span className="font-medium">{problem.title}</span> today?
          </p>
          <p className="max-w-2xl text-sm leading-relaxed text-muted">
            Write the attempt first. A review is a memory workout, not a
            re-read: peeking early is the one thing that makes it worthless.
          </p>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2">
        <label htmlFor={thoughtsId} className="text-xs font-medium text-muted">
          How would you solve this problem today? <span className="text-accent">*</span>
        </label>
        <Textarea
          id={thoughtsId}
          value={thoughts}
          onChange={(event) => onThoughts(event.target.value)}
          maxLength={MAX_REVIEW_THOUGHT_LENGTH}
          rows={12}
          spellCheck
          placeholder={RECALL_PLACEHOLDER}
          className="font-mono text-sm leading-relaxed"
        />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-muted">
            {canReveal
              ? "That is an attempt. Now open up the past."
              : `At least ${MIN_REVIEW_THOUGHT_LENGTH} characters — a line or two, in your own words.`}
          </p>
          <span className="font-mono text-xs text-muted/70 tabular-nums">
            {thoughts.trim().length} / {MAX_REVIEW_THOUGHT_LENGTH}
          </span>
        </div>
      </div>

      <Button size="lg" onClick={onReveal} disabled={!canReveal} className="w-fit">
        Show me what I knew then
        <span aria-hidden>→</span>
      </Button>

      {/* The only thing past sessions may contribute up to this point: that
          they happened, and how long they ran. */}
      <Card className="border-dashed bg-surface/50">
        <CardContent className="flex flex-col gap-3 py-4">
          <div className="flex flex-wrap items-baseline gap-2">
            <h2 className="text-sm font-semibold text-ink">What you tried before</h2>
            {pastSessions.length ? (
              <span className="font-mono text-xs text-muted/70">
                {pastSessions.length}{" "}
                {pastSessions.length === 1 ? "session" : "sessions"}
              </span>
            ) : null}
          </div>

          {pastSessions.length ? (
            <ul className="flex flex-col gap-1.5">
              {pastSessions.map((session) => (
                <li
                  key={session.id}
                  className="flex flex-wrap items-baseline justify-between gap-2 text-xs text-muted"
                >
                  <span>{formatDateTime(session.startedAt)}</span>
                  <span className="font-mono tabular-nums">
                    {formatSessionDuration(session.durationSeconds)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs leading-relaxed text-muted">
              No thinking session was recorded for this problem. There is
              nothing hidden here — you will simply be comparing today&apos;s
              attempt with today&apos;s attempt.
            </p>
          )}

          <p className="border-t border-border pt-3 text-xs leading-relaxed text-muted/80">
            What you wrote, your notes, your solution, and your drawings stay
            closed until you continue. This is the only reminder you get.
          </p>

          <dl className="grid gap-x-6 gap-y-1 text-xs text-muted sm:grid-cols-3">
            <div className="flex gap-1.5">
              <dt className="text-muted/70">Reviews</dt>
              <dd className="font-mono text-ink tabular-nums">{reviewCount}</dd>
            </div>
            <div className="flex gap-1.5">
              <dt className="text-muted/70">Last reviewed</dt>
              <dd className="text-ink">
                {lastReviewedAt ? formatDate(lastReviewedAt) : "Never"}
              </dd>
            </div>
            <div className="flex gap-1.5">
              <dt className="text-muted/70">Was due</dt>
              <dd className="text-ink">
                {nextReviewAt ? formatDate(nextReviewAt) : "No schedule yet"}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}

// ---- phase 2: compare -----------------------------------------------

function ComparePhase({
  thoughts,
  revealState,
  revealPending,
}: {
  thoughts: string;
  revealState: ReviewRevealState;
  revealPending: boolean;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-widest text-accent">
        <span>Step 2 of 2</span>
        <span aria-hidden>·</span>
        <span className="text-muted">Compare</span>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="h-full">
          <CardContent className="flex h-full flex-col gap-3 py-5">
            <h2 className="text-sm font-semibold text-ink">What you just wrote</h2>
            <p className="text-xs text-muted">
              {thoughts.trim().split("\n").length}{" "}
              {thoughts.trim().split("\n").length === 1 ? "line" : "lines"}, written
              from memory before anything was opened.
            </p>
            <p className="whitespace-pre-wrap rounded-lg border border-border bg-surface-2 px-3 py-3 font-mono text-sm leading-relaxed text-ink">
              {thoughts.trim()}
            </p>
            <p className="mt-auto border-t border-border pt-3 text-xs leading-relaxed text-muted/80">
              This is the copy that gets stored. Read the other side, then say
              honestly how it went.
            </p>
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardContent className="flex flex-col gap-4 py-5">
            <h2 className="text-sm font-semibold text-ink">What you knew then</h2>

            {revealPending ? (
              <div className="flex items-center justify-center py-8">
                <Spinner label="Opening your old notes…" />
              </div>
            ) : null}

            {!revealPending && revealState.status === "error" ? (
              <p role="alert" className="text-sm text-rose-400">
                {revealState.message ?? "Your old notes could not be loaded."}
              </p>
            ) : null}

            {revealState.reveal ? <RevealedNotes reveal={revealState.reveal} /> : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/** Everything the recall phase kept closed, in the order it matters. */
function RevealedNotes({ reveal }: { reveal: NonNullable<ReviewRevealState["reveal"]> }) {
  const grouped = NOTE_TYPES.map((type) => ({
    type,
    items: reveal.notes.filter((note) => note.type === type),
  })).filter((group) => group.items.length > 0);

  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-col gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted">
          Your thinking then
        </h3>
        {reveal.session ? (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-muted/80">
              {formatDateTime(reveal.session.startedAt)} ·{" "}
              {formatSessionDuration(reveal.session.durationSeconds)} — {reveal.message}
            </p>
            {reveal.session.thoughts ? (
              <div className="rounded-lg border border-border bg-surface-2 px-3 py-3">
                <Markdown content={reveal.session.thoughts} />
              </div>
            ) : (
              <p className="rounded-lg border border-dashed border-border bg-surface-2/40 px-3 py-3 text-xs leading-relaxed text-muted">
                That session was saved without any written thoughts.
              </p>
            )}
          </div>
        ) : (
          <p className="rounded-lg border border-dashed border-border bg-surface-2/40 px-3 py-3 text-xs leading-relaxed text-muted">
            {reveal.message}
          </p>
        )}
      </section>

      {grouped.map((group) => (
        <section
          key={group.type}
          className="flex flex-col gap-2"
          aria-label={`${NOTE_TYPE_LABELS[group.type]} notes`}
        >
          <h3 className="text-xs font-semibold uppercase tracking-widest text-muted">
            <span aria-hidden>{NOTE_TYPE_EMOJI[group.type]}</span>{" "}
            {NOTE_TYPE_LABELS[group.type]}
          </h3>
          {group.items.map((note) => (
            <article
              key={note.id}
              className="flex flex-col gap-1.5 rounded-lg border border-border px-3 py-2.5"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-ink">{note.title}</span>
                <NoteTypeBadge type={note.type} />
              </div>
              <Markdown content={note.content} />
            </article>
          ))}
        </section>
      ))}

      {reveal.solutions.map((solution) => (
        <section key={solution.id} className="flex flex-col gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-muted">
            Your solution — {languageLabel(solution.language)}
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="font-mono">{solution.language}</Badge>
            {solution.time_complexity ? (
              <Badge variant="subtle" className="font-mono tabular-nums">
                ⏱ {solution.time_complexity}
              </Badge>
            ) : null}
            {solution.space_complexity ? (
              <Badge variant="subtle" className="font-mono tabular-nums">
                🧠 {solution.space_complexity}
              </Badge>
            ) : null}
          </div>
          <div className="overflow-hidden rounded-lg border border-border">
            <Markdown content={codeFence(solution.code, solution.language)} />
          </div>
          {solution.explanation ? (
            <div className="rounded-lg border border-border bg-surface-2 px-3 py-3">
              <Markdown content={solution.explanation} />
            </div>
          ) : null}
        </section>
      ))}

      {reveal.visualizations.map((visualization) => {
        const imageHost = visualizationImageHost(visualization);

        return (
          <section key={visualization.id} className="flex flex-col gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted">
              <span aria-hidden>{VISUALIZATION_TYPE_EMOJI[visualization.type]}</span>{" "}
              {visualization.title}
            </h3>
            <Badge variant="subtle" className="w-fit">
              {visualizationBadgeLabel(visualization.type)}
            </Badge>

            {visualization.type === "mermaid" ? (
              <MermaidDiagram
                code={visualization.content}
                label={visualization.title}
              />
            ) : null}

            {visualization.type === "diagram" ? (
              <div className="overflow-hidden rounded-lg border border-border bg-surface-2/40">
                <pre className="overflow-x-auto whitespace-pre px-3 py-2.5 font-mono text-xs leading-relaxed text-ink">
                  {visualization.content}
                </pre>
              </div>
            ) : null}

            {visualization.type === "image" && imageHost ? (
              <a
                href={visualization.content}
                target="_blank"
                rel="noreferrer noopener"
                className="text-sm font-medium text-accent hover:text-indigo-300"
              >
                Open the picture on {imageHost} <span aria-hidden>↗</span>
              </a>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}

// ---- phase 2: score and save ----------------------------------------

function ScorePhase({
  confidence,
  currentStep,
  status,
  onConfidence,
  onStatus,
  pending,
  fieldErrors,
  message,
}: {
  confidence: number | null;
  currentStep: number;
  status: Problem["status"];
  onConfidence: (value: number) => void;
  onStatus: (value: Problem["status"]) => void;
  pending: boolean;
  fieldErrors: Partial<Record<"thoughts" | "confidence" | "status", string>>;
  message?: string;
}) {
  const statusId = useId();
  const groupId = useId();
  const buttonsRef = useRef<(HTMLButtonElement | null)[]>([]);

  /** Roving focus, so the five buttons behave like one radio group. */
  function move(step: number) {
    const from = confidence ?? MIN_REVIEW_CONFIDENCE;
    const next = Math.min(
      MAX_REVIEW_CONFIDENCE,
      Math.max(MIN_REVIEW_CONFIDENCE, from + step)
    );
    onConfidence(next);
    buttonsRef.current[next - MIN_REVIEW_CONFIDENCE]?.focus();
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-5 py-5">
        <div className="flex flex-col gap-1.5">
          <span
            id={groupId}
            className="text-xs font-medium text-muted"
          >
            How did that go? <span className="text-accent">*</span>
          </span>
          <p className="text-xs leading-relaxed text-muted/80">
            An honest number sets when this comes back. It is the only input
            the schedule takes.
          </p>
        </div>

        <div
          role="radiogroup"
          aria-labelledby={groupId}
          className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5"
        >
          {CONFIDENCE_OPTIONS.map((value) => {
            const checked = confidence === value;
            return (
              <button
                key={value}
                ref={(node) => {
                  buttonsRef.current[value - MIN_REVIEW_CONFIDENCE] = node;
                }}
                type="button"
                role="radio"
                aria-checked={checked}
                tabIndex={
                  checked || (confidence === null && value === MIN_REVIEW_CONFIDENCE)
                    ? 0
                    : -1
                }
                onClick={() => onConfidence(value)}
                onKeyDown={(event) => {
                  if (event.key === "ArrowRight" || event.key === "ArrowDown") {
                    event.preventDefault();
                    move(1);
                  } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
                    event.preventDefault();
                    move(-1);
                  }
                }}
                className={
                  checked
                    ? "flex flex-col gap-1 rounded-lg border border-accent/40 bg-accent/10 px-3 py-2.5 text-left"
                    : "flex flex-col gap-1 rounded-lg border border-border bg-surface px-3 py-2.5 text-left transition-colors hover:border-accent/30 hover:bg-surface-2"
                }
              >
                <span
                  className={
                    checked
                      ? "font-mono text-lg font-semibold text-indigo-200 tabular-nums"
                      : "font-mono text-lg font-semibold text-ink tabular-nums"
                  }
                >
                  {value}
                </span>
                <span
                  className={
                    checked ? "text-xs text-indigo-200" : "text-xs text-muted"
                  }
                >
                  {REVIEW_CONFIDENCE_LABELS[value]}
                </span>
              </button>
            );
          })}
        </div>

        <p aria-live="polite" className="text-sm text-ink">
          {confidence === null
            ? "Pick a number and the next gap appears here."
            : describeInterval(confidence, currentStep)}
        </p>

        {fieldErrors.confidence ? (
          <p role="alert" className="text-xs text-rose-400">
            {fieldErrors.confidence}
          </p>
        ) : null}
        {fieldErrors.thoughts ? (
          <p role="alert" className="text-xs text-rose-400">
            {fieldErrors.thoughts}
          </p>
        ) : null}

        <div className="flex flex-col gap-1.5">
          <label htmlFor={statusId} className="text-xs font-medium text-muted">
            Status after this review
          </label>
          <Select
            id={statusId}
            value={status}
            onChange={(event) => onStatus(event.target.value as Problem["status"])}
            disabled={pending}
            className="w-full sm:w-64"
          >
            {PROBLEM_STATUSES.map((option) => (
              <option key={option} value={option}>
                {STATUS_LABELS[option]}
              </option>
            ))}
          </Select>
          <p className="text-xs text-muted/80">
            {status === "review"
              ? "Left on Review, so it keeps coming back until you say otherwise."
              : "Only sent when you change it — the problem's status is otherwise untouched."}
          </p>
          {fieldErrors.status ? (
            <p role="alert" className="text-xs text-rose-400">
              {fieldErrors.status}
            </p>
          ) : null}
        </div>

        {message ? (
          <p
            role="alert"
            className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300"
          >
            {message}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border pt-4">
          {pending ? <Spinner label="Saving…" /> : null}
          <Button type="submit" size="lg" disabled={pending || confidence === null}>
            Save review
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ---- after saving ---------------------------------------------------

/**
 * What a saved review says back. Deliberately small: the schedule, the date,
 * and the way out. No confetti, no streak counter — the point was the attempt,
 * and it is already stored.
 */
function Confirmation({
  state,
  problemId,
}: {
  state: ReviewFormState;
  problemId: string;
}) {
  const days = state.intervalDays ?? 0;

  return (
    <Card className="border-emerald-500/30">
      <CardContent className="flex flex-col gap-3 py-5">
        <h2 className="text-sm font-semibold text-ink">
          Saved. Next review in {days} {days === 1 ? "day" : "days"} —{" "}
          {reviewLadderLabel(state.step ?? 0)}.
        </h2>
        <p className="text-sm leading-relaxed text-muted">
          {state.nextReviewAt
            ? `It comes back on ${formatDate(state.nextReviewAt)}.`
            : "It comes back to the review queue when its turn arrives."}{" "}
          {state.elapsedDays === null || state.elapsedDays === undefined
            ? "This is the first review of this problem."
            : `That is ${state.elapsedDays} ${
                state.elapsedDays === 1 ? "day" : "days"
              } after the one before it.`}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/review">
            <Button variant="outline" size="sm">
              Back to the review queue
            </Button>
          </Link>
          <Link
            href={`/problems/${problemId}`}
            className="text-sm font-medium text-accent hover:text-indigo-300"
          >
            Open the problem →
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
