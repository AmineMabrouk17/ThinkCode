import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getReviewStats, getWorkspaceStats } from "@/lib/db";
import {
  DEFAULT_THINKING_MINUTES,
  MAX_THINKING_MINUTES,
  MIN_THINKING_MINUTES,
  THINKING_DURATION_PRESETS,
} from "@/lib/constants";
import {
  REVIEW_INTERVAL_DAYS,
  formatInterval,
} from "@/lib/spaced-repetition";
import { formatDate } from "@/lib/utils";
import type { WorkspaceStats } from "@/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Settings",
  description:
    "The review schedule, the timer's limits, and what this workspace currently holds.",
};

/**
 * Settings is deliberately a *description* rather than a form.
 *
 * Every value here is compiled into the app, not stored per user: the review
 * ladder is a rule about forgetting, the timer bounds are guard rails, and the
 * workspace is whatever the database holds. Rendering switches that cannot
 * change anything would be a lie, so the page answers the question people
 * actually open Settings to ask — "what exactly is this app doing to me?" — by
 * showing the real numbers, with the file that owns each one named underneath.
 */
export default async function SettingsPage() {
  const [workspace, reviews] = await Promise.all([
    getWorkspaceStats(),
    getReviewStats(),
  ]);

  return (
    <div>
      <PageHeader
        eyebrow="Preferences"
        title="Settings"
        description="What this workspace does with your time, and what it is holding for you."
      />

      <div className="flex flex-col gap-4">
        <div className="grid gap-4 lg:grid-cols-2">
          <ReviewScheduleCard />
          <TimerCard />
          <WorkspaceCard stats={workspace} />
          <ReviewHealthCard
            totalReviews={reviews.totalReviews}
            reviewedProblems={reviews.reviewedProblems}
            dueCount={reviews.dueCount}
            averageConfidence={reviews.averageConfidence}
            lastReviewedAt={reviews.lastReviewedAt}
          />
        </div>

        <Card>
          <CardContent className="flex flex-col gap-4 py-5">
            <div>
              <h2 className="text-base font-semibold text-ink">
                About the AI in your workflow
              </h2>
              <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted">
                ThinkCode does not call an AI model, and it does not summarise
                what you wrote. The resources section stores the <em>links</em>{" "}
                to your conversations and videos so the external work stays
                external — what lands in your notes is what you actually reasoned,
                not what a model compressed it into.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <Link
                href="/patterns"
                className="font-medium text-accent hover:text-indigo-300"
              >
                Patterns library <span aria-hidden>→</span>
              </Link>
              <span className="text-muted">
                {workspace.patterns} patterns, {workspace.aiConversations} saved
                conversations
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ReviewScheduleCard() {
  return (
    <Card className="h-full">
      <CardContent className="flex h-full flex-col gap-4 py-5">
        <div>
          <h2 className="text-base font-semibold text-ink">Review schedule</h2>
          <p className="mt-1 text-sm text-muted">
            How long a problem waits before it comes back, based on how the review
            went.
          </p>
        </div>

        <ol className="flex flex-wrap items-center gap-2">
          {REVIEW_INTERVAL_DAYS.map((days, index) => (
            <li key={days} className="flex items-center gap-2">
              {index > 0 ? (
                <span aria-hidden className="text-border">
                  →
                </span>
              ) : null}
              <Badge variant="subtle" className="font-mono">
                {formatInterval(days)}
              </Badge>
            </li>
          ))}
        </ol>

        <ul className="flex flex-col gap-1.5 text-xs leading-relaxed text-muted">
          <li>
            <span className="text-ink">Stuck, or needed the old answer</span> —
            back to {formatInterval(REVIEW_INTERVAL_DAYS[0])}. Closer, not
            further.
          </li>
          <li>
            <span className="text-ink">Would get there, slowly</span> — stay on
            the current rung.
          </li>
          <li>
            <span className="text-ink">Held up without the notes</span> — move up
            one rung, stopping at {formatInterval(REVIEW_INTERVAL_DAYS[4])}.
          </li>
        </ul>

        <Source path="src/lib/spaced-repetition.ts" />
      </CardContent>
    </Card>
  );
}

function TimerCard() {
  return (
    <Card className="h-full">
      <CardContent className="flex h-full flex-col gap-4 py-5">
        <div>
          <h2 className="text-base font-semibold text-ink">Thinking timer</h2>
          <p className="mt-1 text-sm text-muted">
            How long you are asked to struggle before it is reasonable to reach
            for help.
          </p>
        </div>

        <div className="flex flex-wrap items-baseline gap-2">
          <span className="text-2xl font-semibold text-ink">
            {DEFAULT_THINKING_MINUTES}
          </span>
          <span className="text-sm text-muted">minutes by default</span>
        </div>

        <ul className="flex flex-col gap-1.5 text-xs leading-relaxed text-muted">
          <li>
            Presets:{" "}
            <span className="font-mono text-ink">
              {THINKING_DURATION_PRESETS.join(" / ")}
            </span>{" "}
            minutes.
          </li>
          <li>
            Anything from {MIN_THINKING_MINUTES} to {MAX_THINKING_MINUTES}{" "}
            minutes is allowed — the timer is a suggestion, not a gate.
          </li>
          <li>
            Sessions keep whatever length you actually spent, including a partial
            one.
          </li>
        </ul>

        <Source path="src/lib/constants.ts" />
      </CardContent>
    </Card>
  );
}

function WorkspaceCard({ stats }: { stats: WorkspaceStats }) {
  const rows: Array<[string, number]> = [
    ["Problems", stats.problems],
    ["Knowledge notes", stats.notes],
    ["Solutions", stats.solutions],
    ["Thinking sessions", stats.thinkingSessions],
    ["Reviews logged", stats.reviews],
    ["Patterns", stats.patterns],
    ["Tags", stats.tags],
    ["Visualizations", stats.visualizations],
    ["Resources & conversations", stats.resources + stats.aiConversations],
  ];

  return (
    <Card className="h-full">
      <CardContent className="flex h-full flex-col gap-4 py-5">
        <div>
          <h2 className="text-base font-semibold text-ink">This workspace</h2>
          <p className="mt-1 text-sm text-muted">
            What is stored right now, in your own D1 database.
          </p>
        </div>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
          {rows.map(([label, value]) => (
            <div key={label} className="flex flex-col">
              <dt className="text-xs text-muted">{label}</dt>
              <dd className="font-mono text-lg text-ink">{value}</dd>
            </div>
          ))}
        </dl>

        <p className="mt-auto text-xs leading-relaxed text-muted/80">
          Nothing here is sent anywhere. The database is yours; the links you keep
          are the only outbound references.
        </p>
      </CardContent>
    </Card>
  );
}

function ReviewHealthCard({
  totalReviews,
  reviewedProblems,
  dueCount,
  averageConfidence,
  lastReviewedAt,
}: {
  totalReviews: number;
  reviewedProblems: number;
  dueCount: number;
  averageConfidence: number | null;
  lastReviewedAt: string | null;
}) {
  return (
    <Card className="h-full">
      <CardContent className="flex h-full flex-col gap-4 py-5">
        <div>
          <h2 className="text-base font-semibold text-ink">Review health</h2>
          <p className="mt-1 text-sm text-muted">
            Work outstanding, not a score. There is no target to hit here.
          </p>
        </div>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
          <div>
            <dt className="text-xs text-muted">Due now</dt>
            <dd className="font-mono text-lg text-ink">{dueCount}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Problems reviewed</dt>
            <dd className="font-mono text-lg text-ink">{reviewedProblems}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Reviews logged</dt>
            <dd className="font-mono text-lg text-ink">{totalReviews}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Mean confidence</dt>
            <dd className="font-mono text-lg text-ink">
              {averageConfidence === null ? "—" : averageConfidence.toFixed(2)}
            </dd>
          </div>
        </dl>

        <p className="mt-auto text-xs text-muted/80">
          {lastReviewedAt
            ? `Last review ${formatDate(lastReviewedAt)}.`
            : "No review logged yet."}
        </p>
      </CardContent>
    </Card>
  );
}

/** Names the file that owns a value, so "why is it 15?" has an answer. */
function Source({ path }: { path: string }) {
  return (
    <p className="mt-auto text-xs text-muted/80">
      Defined in <code className="font-mono text-ink/90">{path}</code>
    </p>
  );
}
