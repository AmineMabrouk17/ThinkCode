import Link from "next/link";

import type {
  NoteType,
  PatternWithCount,
  Problem,
  ReviewDueProblem,
  RecentNote,
} from "@/types";
import { getDashboardData } from "@/lib/db";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DifficultyBadge } from "@/components/ui/difficulty-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";

export const dynamic = "force-dynamic";

const NOTE_STYLES: Record<
  NoteType,
  { label: string; emoji: string; className: string }
> = {
  mental_model: {
    label: "Mental model",
    emoji: "🧠",
    className: "border-violet-400/30 bg-violet-400/10 text-violet-300",
  },
  key_lesson: {
    label: "Key lesson",
    emoji: "💡",
    className: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  },
  mistake: {
    label: "Mistake",
    emoji: "❌",
    className: "border-rose-400/30 bg-rose-400/10 text-rose-300",
  },
  general: {
    label: "General",
    emoji: "📝",
    className: "border-border bg-surface-2 text-muted",
  },
};

function getGreeting(now: Date): string {
  const hour = now.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function SectionHeader({
  id,
  title,
  hint,
  action,
}: {
  id: string;
  title: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-baseline gap-2">
        <h2 id={id} className="text-lg font-semibold tracking-tight text-ink">
          {title}
        </h2>
        {hint ? <p className="text-xs text-muted">{hint}</p> : null}
      </div>
      {action}
    </div>
  );
}

function StatCard({
  emoji,
  value,
  label,
  valueClassName,
}: {
  emoji: string;
  value: number;
  label: string;
  valueClassName?: string;
}) {
  return (
    <Card className="flex items-center gap-4 p-5">
      <span
        className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-surface-2 text-xl"
        aria-hidden
      >
        {emoji}
      </span>
      <div>
        <p
          className={cn(
            "font-mono text-2xl font-semibold text-ink",
            valueClassName
          )}
        >
          {value}
        </p>
        <p className="text-sm text-muted">{label}</p>
      </div>
    </Card>
  );
}

function ProblemRow({ problem }: { problem: Problem }) {
  const href = `/problems/${problem.id}`;

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <Link
            href={href}
            className="truncate font-medium text-ink hover:text-accent"
          >
            {problem.title}
          </Link>
          <p className="truncate text-xs text-muted">
            {problem.category} · {problem.platform}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <DifficultyBadge difficulty={problem.difficulty} />
          <StatusBadge status={problem.status} />
          <Link
            href={href}
            aria-label={`Open ${problem.title}`}
            className="rounded-lg px-1 text-accent hover:text-indigo-300"
          >
            <span aria-hidden>→</span>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function ReviewRow({ problem }: { problem: ReviewDueProblem }) {
  const href = `/problems/${problem.id}`;
  const lastReviewed =
    problem.days_since_review === null
      ? "Never reviewed yet"
      : `Last reviewed ${problem.days_since_review} ${
          problem.days_since_review === 1 ? "day" : "days"
        } ago`;

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <Link
            href={href}
            className="truncate font-medium text-ink hover:text-accent"
          >
            {problem.title}
          </Link>
          <p className="truncate text-xs text-muted">
            {problem.category} · {lastReviewed}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <DifficultyBadge difficulty={problem.difficulty} />
          <StatusBadge status={problem.status} />
          <Link
            href={href}
            aria-label={`Review ${problem.title}`}
            className="rounded-lg px-1 text-accent hover:text-indigo-300"
          >
            <span aria-hidden>→</span>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function NoteRow({ note }: { note: RecentNote }) {
  const href = `/problems/${note.problem_id}`;
  const style = NOTE_STYLES[note.type];

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <Link
            href={href}
            className="truncate font-medium text-ink hover:text-accent"
          >
            {note.title}
          </Link>
          <p className="truncate text-xs text-muted">{note.problem_title}</p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Badge className={style.className} aria-label={`Note: ${style.label}`}>
            <span aria-hidden>{style.emoji}</span>
            {style.label}
          </Badge>
          <Link
            href={href}
            aria-label={`Open ${note.problem_title}`}
            className="rounded-lg px-1 text-accent hover:text-indigo-300"
          >
            <span aria-hidden>→</span>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function PatternCard({ pattern }: { pattern: PatternWithCount }) {
  return (
    <Link
      href="/patterns"
      className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3 transition-colors hover:bg-surface-2"
    >
      <span className="truncate text-sm font-medium text-ink">
        {pattern.name}
      </span>
      <span className="shrink-0 font-mono text-sm text-muted">
        {pattern.problem_count}
      </span>
    </Link>
  );
}

export default async function DashboardPage() {
  const { total, counts, continueLearning, needsReview, recentNotes, topPatterns } =
    await getDashboardData();

  const greeting = getGreeting(new Date());
  const completed = counts.understood + counts.mastered;
  const learning = counts.learning + counts.confusing;
  const nextUp = continueLearning[0];

  return (
    <div className="flex flex-col gap-9">
      {/* Greeting */}
      <header className="flex flex-col gap-4 border-b border-border pb-7">
        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">
            Your Learning Space
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            {greeting} 👋
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-muted">
            Pick up where you left off, revisit what is fading, and keep the
            reasoning — not just the answer.
          </p>
        </div>
        {nextUp ? (
          <div>
            <Link
              href={`/problems/${nextUp.id}`}
              aria-label={`Continue learning ${nextUp.title}`}
            >
              <Button variant="outline" size="sm">
                <span aria-hidden>→</span>
                Continue learning · {nextUp.title}
              </Button>
            </Link>
          </div>
        ) : null}
      </header>

      {/* Progress */}
      <section aria-labelledby="progress-heading" className="flex flex-col gap-4">
        <SectionHeader
          id="progress-heading"
          title="Progress"
          hint="Statistics here support your learning, not a streak."
          action={
            <Badge variant="subtle">🔴 {counts.confusing} confusing</Badge>
          }
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard emoji="📚" value={total} label="Total problems" />
          <StatCard
            emoji="✅"
            value={completed}
            label="Completed"
            valueClassName="text-emerald-400"
          />
          <StatCard emoji="🔄" value={counts.review} label="Reviewing" />
          <StatCard emoji="🟡" value={learning} label="Learning" />
        </div>
      </section>

      {/* Continue learning */}
      <section aria-labelledby="continue-heading" className="flex flex-col gap-4">
        <SectionHeader
          id="continue-heading"
          title="Continue learning"
          hint="Unfinished problems, most recently updated first."
          action={
            <Link
              href="/problems"
              className="text-sm font-medium text-accent hover:text-indigo-300"
            >
              View all →
            </Link>
          }
        />
        {continueLearning.length > 0 ? (
          <div className="grid gap-3">
            {continueLearning.map((problem) => (
              <ProblemRow key={problem.id} problem={problem} />
            ))}
          </div>
        ) : (
          <EmptyState
            emoji="🎉"
            title="Everything is mastered"
            description="No problem is waiting on you. Add a new one from the library when you are ready to learn something else."
            action={
              <Link href="/problems">
                <Button variant="outline" size="sm">
                  Browse problems
                </Button>
              </Link>
            }
          />
        )}
      </section>

      {/* Needs review */}
      <section aria-labelledby="review-heading" className="flex flex-col gap-4">
        <SectionHeader
          id="review-heading"
          title="Needs review"
          hint="Try them again from memory before reopening your notes."
          action={
            <Link
              href="/review"
              className="text-sm font-medium text-accent hover:text-indigo-300"
            >
              Review queue →
            </Link>
          }
        />
        {needsReview.length > 0 ? (
          <div className="grid gap-3">
            {needsReview.map((problem) => (
              <ReviewRow key={problem.id} problem={problem} />
            ))}
          </div>
        ) : (
          <EmptyState
            emoji="🔄"
            title="Nothing is due for review"
            description="Revisit a problem once its scheduled date arrives — ThinkCode will bring it back here."
            action={
              <Link href="/review">
                <Button variant="outline" size="sm">
                  Open review
                </Button>
              </Link>
            }
          />
        )}
      </section>

      {/* Recent insights */}
      <section aria-labelledby="insights-heading" className="flex flex-col gap-4">
        <SectionHeader
          id="insights-heading"
          title="Recent insights"
          hint="Your latest mental models, lessons, and mistakes."
        />
        {recentNotes.length > 0 ? (
          <div className="grid gap-3">
            {recentNotes.map((note) => (
              <NoteRow key={note.id} note={note} />
            ))}
          </div>
        ) : (
          <EmptyState
            emoji="📝"
            title="No notes yet"
            description="After solving a problem, write down how you understood it — that note is what future-you comes back for."
          />
        )}
      </section>

      {/* Patterns */}
      <section aria-labelledby="patterns-heading" className="flex flex-col gap-4">
        <SectionHeader
          id="patterns-heading"
          title="Patterns"
          hint="The patterns your problems keep using."
          action={
            <Link
              href="/patterns"
              className="text-sm font-medium text-accent hover:text-indigo-300"
            >
              All patterns →
            </Link>
          }
        />
        {topPatterns.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {topPatterns.map((pattern) => (
              <PatternCard key={pattern.id} pattern={pattern} />
            ))}
          </div>
        ) : (
          <EmptyState
            emoji="🧠"
            title="No patterns catalogued"
            description="Link problems to patterns to see which ideas you keep reaching for."
          />
        )}
      </section>

      <footer className="border-t border-border pt-5">
        <p className="text-xs text-muted">
          <span
            className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 align-middle"
            aria-hidden
          />
          {`Live data from Cloudflare D1 — ${total} ${
            total === 1 ? "problem" : "problems"
          } in your library. Think first, understand deeply, remember forever.`}
        </p>
      </footer>
    </div>
  );
}
