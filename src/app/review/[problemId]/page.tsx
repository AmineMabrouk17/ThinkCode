import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  getProblemDetail,
  listReviews,
  listThinkingSessions,
} from "@/lib/db";
import { reviewLadderLabel, stepFromReviews } from "@/lib/spaced-repetition";
import { ReviewSession } from "@/components/review/review-session";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { DifficultyBadge } from "@/components/ui/difficulty-badge";
import { StatusBadge } from "@/components/ui/status-badge";
import type { ReviewPastSession } from "@/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ problemId: string }>;
}): Promise<Metadata> {
  const { problemId } = await params;
  const problem = await getProblemDetail(problemId);
  return { title: problem ? `Review · ${problem.title}` : "Review" };
}

export default async function ReviewProblemPage({
  params,
}: {
  params: Promise<{ problemId: string }>;
}) {
  const { problemId } = await params;

  const [problem, sessions, reviews] = await Promise.all([
    getProblemDetail(problemId),
    listThinkingSessions(problemId),
    listReviews(problemId),
  ]);

  if (!problem) notFound();

  // Only the shape of the past sessions crosses to the client: when they
  // happened and how long they ran. The thoughts stay on the server until the
  // reveal asks for them, so they are never in this page's payload.
  const pastSessions: ReviewPastSession[] = sessions.map((session) => ({
    id: session.id,
    startedAt: session.started_at,
    durationSeconds: session.duration_seconds,
  }));

  const currentStep = stepFromReviews(reviews);
  const lastReviewedAt = reviews[0]?.reviewed_at ?? null;
  // The oldest schedule still standing is the one that governs: it is the date
  // this problem was actually waiting for you on.
  const nextReviewAt =
    reviews
      .map((review) => review.next_review_at)
      .filter((value): value is string => Boolean(value))
      .sort()[0] ?? null;

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/review"
        className="w-fit text-sm font-medium text-accent hover:text-indigo-300"
      >
        <span aria-hidden>←</span> Review
      </Link>

      <Card>
        <CardContent className="flex flex-col gap-4 py-5">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                {problem.title}
              </h1>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <DifficultyBadge difficulty={problem.difficulty} />
                <StatusBadge status={problem.status} />
              </div>
            </div>

            <p className="text-sm text-muted">
              {problem.platform}
              {problem.category ? ` · ${problem.category}` : null}
            </p>

            {problem.description ? (
              <p className="max-w-3xl text-sm leading-relaxed text-muted">
                {problem.description}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
            <Badge variant="subtle">
              {reviews.length}{" "}
              {reviews.length === 1 ? "review" : "reviews"} logged
            </Badge>
            <Badge variant="subtle">Currently {reviewLadderLabel(currentStep)} spacing</Badge>
            {problem.external_url ? (
              <a
                href={problem.external_url}
                target="_blank"
                rel="noreferrer noopener"
                className="text-sm font-medium text-accent hover:text-indigo-300"
              >
                Open the original <span aria-hidden>↗</span>
              </a>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <ReviewSession
        problem={problem}
        pastSessions={pastSessions}
        currentStep={currentStep}
        reviewCount={reviews.length}
        lastReviewedAt={lastReviewedAt}
        nextReviewAt={nextReviewAt}
      />
    </div>
  );
}
