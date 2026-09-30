"use client";

import Link from "next/link";
import { useState } from "react";

import { Markdown } from "@/components/knowledge/markdown";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { REVIEW_CONFIDENCE_LABELS } from "@/lib/constants";
import { REVIEW_INTERVAL_DAYS, stepFromSchedule } from "@/lib/spaced-repetition";
import { formatDate } from "@/lib/utils";
import type { Review } from "@/types";

/**
 * The REFLECT section of a problem page: every review you have logged, and the
 * door back into the next one.
 *
 * It is deliberately the smallest of the seven sections — the history is a
 * reference, not the point. The point is the attempt you make in
 * `/review/<id>` before anything here is shown again.
 */
export function ReviewHistorySection({
  problemId,
  reviews,
}: {
  problemId: string;
  reviews: Review[];
}) {
  const nextDue = reviews[0]?.next_review_at ?? null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted">
          {reviews.length
            ? `${reviews.length} ${reviews.length === 1 ? "review" : "reviews"} logged${
                nextDue ? ` · next due ${formatDate(nextDue)}` : ""
              }.`
            : "Re-solving from memory is what moves a problem from read to known."}
        </p>
        <Link href={`/review/${problemId}`}>
          <Button variant={reviews.length ? "outline" : "primary"}>
            Start review <span aria-hidden>→</span>
          </Button>
        </Link>
      </div>

      {reviews.length ? (
        <ul className="flex flex-col gap-2">
          {reviews.map((review) => (
            <li key={review.id}>
              <ReviewHistoryCard review={review} />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          emoji="🔄"
          title="Never reviewed"
          description="The fastest way to forget a problem is to never look at it again."
          className="py-8"
        />
      )}
    </div>
  );
}

/**
 * One logged review: when it happened, how it went, and — collapsed by
 * default — the attempt you wrote from memory that time.
 */
function ReviewHistoryCard({ review }: { review: Review }) {
  const [open, setOpen] = useState(false);
  const step = stepFromSchedule(review.reviewed_at, review.next_review_at);
  const rung = REVIEW_INTERVAL_DAYS[step];

  return (
    <Card className="transition-colors hover:border-accent/40">
      <CardContent className="flex flex-col gap-3 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-ink">{formatDate(review.reviewed_at)}</span>
            {review.confidence === null ? (
              <Badge variant="subtle">No score</Badge>
            ) : (
              <Badge
                variant="subtle"
                className="font-mono tabular-nums"
                aria-label={`Confidence ${review.confidence} of 5 — ${REVIEW_CONFIDENCE_LABELS[review.confidence] ?? ""}`}
              >
                {review.confidence}/5 · {REVIEW_CONFIDENCE_LABELS[review.confidence]}
              </Badge>
            )}
            {review.elapsed_days !== null ? (
              <span className="text-xs text-muted">
                {review.elapsed_days} {review.elapsed_days === 1 ? "day" : "days"} after
                the last one
              </span>
            ) : (
              <span className="text-xs text-muted">first review</span>
            )}
          </div>

          {review.next_review_at ? (
            <span className="text-xs text-muted">
              {review.next_review_at <= new Date().toISOString().slice(0, 19).replace("T", " ")
                ? "due now"
                : `was due ${formatDate(review.next_review_at)}`}
              {rung ? ` · ${rung}-day rung` : ""}
            </span>
          ) : null}
        </div>

        {review.thoughts ? (
          <>
            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              aria-expanded={open}
              className="w-fit text-xs font-medium text-accent hover:text-indigo-300"
            >
              {open ? "Hide what you wrote then" : "Read what you wrote then"}
            </button>
            {open ? (
              <div className="rounded-lg border border-border bg-surface-2 px-4 py-3">
                <Markdown content={review.thoughts} />
              </div>
            ) : null}
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
