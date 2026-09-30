import type { Metadata } from "next";
import Link from "next/link";

import {
  getReviewStats,
  listProblemsDueForReview,
  listRecentReviews,
} from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { DifficultyBadge } from "@/components/ui/difficulty-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import type { RecentReview, ReviewDueProblem, ReviewStats } from "@/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Review",
  description:
    "Revisit old problems before you peek at your notes — your reasoning now, compared against your reasoning then.",
};

/** The four numbers at the top: counts of work done, never a score. */
function StatsStrip({ stats }: { stats: ReviewStats }) {
  const average =
    stats.averageConfidence === null
      ? "—"
      : `${stats.averageConfidence.toFixed(1)}/5`;

  const items = [
    { label: "Reviews logged", value: String(stats.totalReviews) },
    { label: "Problems reviewed", value: String(stats.reviewedProblems) },
    { label: "Due right now", value: String(stats.dueCount) },
    { label: "Average confidence", value: average },
  ];

  return (
    <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label}>
          <CardContent className="flex flex-col gap-0.5 py-4">
            <dd className="font-mono text-xl font-semibold text-ink tabular-nums">
              {item.value}
            </dd>
            <dt className="text-xs text-muted">{item.label}</dt>
          </CardContent>
        </Card>
      ))}
    </dl>
  );
}

function DueRow({ problem }: { problem: ReviewDueProblem }) {
  const lastReviewed =
    problem.days_since_review === null
      ? "never reviewed"
      : `last reviewed ${problem.days_since_review} ${
          problem.days_since_review === 1 ? "day" : "days"
        } ago`;

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <p className="truncate font-medium text-ink">{problem.title}</p>
          <p className="truncate text-xs text-muted">
            {problem.category ? `${problem.category} · ` : ""}
            {lastReviewed}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <DifficultyBadge difficulty={problem.difficulty} />
          <StatusBadge status={problem.status} />
          <span className="text-xs text-muted">
            {problem.due_at ? `due ${formatDate(problem.due_at)}` : "flagged for review"}
          </span>
          <Link
            href={`/review/${problem.id}`}
            className="text-sm font-medium text-accent hover:text-indigo-300"
          >
            Start review <span aria-hidden>→</span>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function HistoryRow({ review }: { review: RecentReview }) {
  const elapsed =
    review.elapsed_days === null
      ? "first review of this problem"
      : `reviewed ${review.elapsed_days} ${
          review.elapsed_days === 1 ? "day" : "days"
        } after the last one`;

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface px-3 py-2.5">
      <div className="flex min-w-0 flex-col gap-0.5">
        <Link
          href={`/review/${review.problem_id}`}
          className="truncate text-sm font-medium text-ink hover:text-accent"
        >
          {review.problem_title}
        </Link>
        <span className="truncate text-xs text-muted">
          {formatDate(review.reviewed_at)} · {elapsed}
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Badge
          variant="subtle"
          className="font-mono tabular-nums"
          aria-label={`Confidence ${review.confidence ?? 0} of 5`}
        >
          {review.confidence ?? "—"}/5
        </Badge>
      </div>
    </li>
  );
}

function SectionHeader({
  id,
  title,
  hint,
  count,
}: {
  id: string;
  title: string;
  hint: string;
  count?: number;
}) {
  return (
    <div className="flex flex-wrap items-baseline gap-2">
      <h2 id={id} className="text-lg font-semibold tracking-tight text-ink">
        {title}
      </h2>
      {count !== undefined ? (
        <span className="font-mono text-xs text-muted/70 tabular-nums">{count}</span>
      ) : null}
      <p className="text-xs text-muted">{hint}</p>
    </div>
  );
}

export default async function ReviewPage() {
  const [due, recent, stats] = await Promise.all([
    listProblemsDueForReview(20),
    listRecentReviews(10),
    getReviewStats(),
  ]);

  return (
    <div>
      <PageHeader
        eyebrow="Remember"
        title="Review"
        description="Revisit old problems before you peek at your notes. Your reasoning now is compared against your reasoning then."
      />

      <div className="flex flex-col gap-9">
        <StatsStrip stats={stats} />

        {/* Due for review */}
        <section aria-labelledby="due-heading" className="flex flex-col gap-4">
          <SectionHeader
            id="due-heading"
            title="Due for review"
            hint="Problems whose moment has come around, or that you flagged."
            count={due.length}
          />

          {due.length ? (
            <div className="grid gap-3">
              {due.map((problem) => (
                <DueRow key={problem.id} problem={problem} />
              ))}
            </div>
          ) : (
            <EmptyState
              emoji="🔄"
              title="Nothing is due right now"
              description="Come back tomorrow. A problem returns here when its review date arrives, and reviewing early is still possible from its own page."
              action={
                <Link
                  href="/problems"
                  className="text-sm font-medium text-accent hover:text-indigo-300"
                >
                  Browse problems →
                </Link>
              }
            />
          )}
        </section>

        {/* Recently reviewed */}
        <section aria-labelledby="history-heading" className="flex flex-col gap-4">
          <SectionHeader
            id="history-heading"
            title="Recently reviewed"
            hint="Every attempt you wrote from memory, newest first."
            count={recent.length}
          />

          {recent.length ? (
            <ul className="flex flex-col gap-2">
              {recent.map((review) => (
                <HistoryRow key={review.id} review={review} />
              ))}
            </ul>
          ) : (
            <EmptyState
              emoji="🕰️"
              title="No reviews yet"
              description="Reviews show up here once you work through a problem from memory — each one records what you wrote, how it went, and when it comes back."
            />
          )}
        </section>

        <footer className="border-t border-border pt-5">
          <p className="text-xs text-muted">
            Intervals follow Day 1, 3, 7, 14, 30 — a problem you keep missing
            starts the ladder again, one you know stays in rotation.{" "}
            {stats.lastReviewedAt
              ? `Last review on ${formatDate(stats.lastReviewedAt)}.`
              : "No review has been logged yet."}
          </p>
        </footer>
      </div>
    </div>
  );
}
