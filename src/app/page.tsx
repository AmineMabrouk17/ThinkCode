import Link from "next/link";

import { countPatterns, countProblems, listProblems } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { DifficultyBadge } from "@/components/ui/difficulty-badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [problemCount, patternCount, recent] = await Promise.all([
    countProblems(),
    countPatterns(),
    listProblems(),
  ]);

  const recentProblems = recent.slice(0, 5);

  return (
    <div className="flex flex-col gap-10">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-surface via-surface to-surface-2 p-8 sm:p-10">
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-violet-500/10 blur-3xl"
          aria-hidden
        />
        <div className="relative flex flex-col gap-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">
            Your Learning Space
          </p>
          <h1 className="max-w-xl text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl">
            Think first.{" "}
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              Understand deeply.
            </span>{" "}
            Remember forever.
          </h1>
          <p className="max-w-lg text-sm leading-relaxed text-muted">
            ThinkCode is where your algorithm-solving journey becomes your
            personal knowledge base — problems, thinking sessions, AI
            conversations, visualizations, solutions, and reviews, all in one
            calm workspace.
          </p>
          <div className="mt-2 flex flex-wrap gap-3">
            <Link href="/problems">
              <Button>📚 Browse problems</Button>
            </Link>
            <Link href="/patterns">
              <Button variant="outline">🧠 Explore patterns</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section aria-label="Database sanity check" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="flex items-center gap-4 p-5">
          <span
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-surface-2 text-xl"
            aria-hidden
          >
            📚
          </span>
          <div>
            <p className="font-mono text-2xl font-semibold text-ink">
              {problemCount}
            </p>
            <p className="text-sm text-muted">problems in D1</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-5">
          <span
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-surface-2 text-xl"
            aria-hidden
          >
            🧠
          </span>
          <div>
            <p className="font-mono text-2xl font-semibold text-ink">
              {patternCount}
            </p>
            <p className="text-sm text-muted">patterns catalogued</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-5 sm:col-span-2 lg:col-span-1">
          <span
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-surface-2 text-xl"
            aria-hidden
          >
            ✅
          </span>
          <div>
            <p className="font-mono text-lg font-semibold text-emerald-400">
              DB connected
            </p>
            <p className="text-sm text-muted">read via Cloudflare D1</p>
          </div>
        </Card>
      </section>

      {/* Recent problems */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight text-ink">
            Recently added
          </h2>
          <Link
            href="/problems"
            className="text-sm font-medium text-accent hover:text-indigo-300"
          >
            View all →
          </Link>
        </div>
        {recentProblems.length > 0 ? (
          <div className="grid gap-3">
            {recentProblems.map((problem) => (
              <Card key={problem.id}>
                <CardContent className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                  <div className="flex min-w-0 flex-col gap-1">
                    <p className="truncate font-medium text-ink">{problem.title}</p>
                    <p className="text-xs text-muted">
                      {problem.category} · {problem.platform}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <DifficultyBadge difficulty={problem.difficulty} />
                    <StatusBadge status={problem.status} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="text-sm text-muted">
                No problems yet — add the first one to kick off your library.
              </p>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Note */}
      <section>
        <Badge variant="subtle" className="gap-1.5">
          <span aria-hidden>🚧</span>
          The full dashboard (progress, review queue, spaced repetition) ships
          with the next features.
        </Badge>
      </section>
    </div>
  );
}