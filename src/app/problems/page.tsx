import type { Metadata } from "next";
import Link from "next/link";

import {
  CATEGORY_OPTIONS,
  PLATFORM_OPTIONS,
  isDifficulty,
  isProblemStatus,
} from "@/lib/constants";
import {
  countProblems,
  listDistinctCategories,
  listDistinctPlatforms,
  listPatterns,
  listProblemsFiltered,
  listTags,
} from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { NewProblemButton } from "@/components/problems/new-problem-button";
import { ProblemFilters } from "@/components/problems/problem-filters";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { DifficultyBadge } from "@/components/ui/difficulty-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import type { ProblemFilters as Filters, ProblemWithMeta } from "@/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Problems",
  description:
    "Your algorithm problem library — search, filter, and organize every problem you learn from.",
};

/** Read the URL into typed filters; unknown enum values are dropped. */
function parseFilters(
  searchParams: Record<string, string | string[] | undefined>
): Filters {
  const one = (key: string) => {
    const value = searchParams[key];
    return (Array.isArray(value) ? value[0] : value)?.trim() || undefined;
  };

  const difficulty = one("difficulty");
  const status = one("status");

  return {
    q: one("q"),
    platform: one("platform"),
    category: one("category"),
    pattern: one("pattern"),
    tag: one("tag"),
    difficulty:
      difficulty && isDifficulty(difficulty) ? difficulty : undefined,
    status: status && isProblemStatus(status) ? status : undefined,
  };
}

function ProblemCard({ problem }: { problem: ProblemWithMeta }) {
  return (
    <Card className="transition-colors hover:border-accent/40">
      <CardContent className="flex flex-col gap-3 py-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <Link
              href={`/problems/${problem.id}`}
              className="truncate font-medium text-ink hover:text-accent"
            >
              {problem.title}
            </Link>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <DifficultyBadge difficulty={problem.difficulty} />
              <StatusBadge status={problem.status} />
            </div>
          </div>
          <p className="truncate text-xs text-muted">
            {problem.platform} · {problem.category}
          </p>
        </div>

        {problem.patterns.length || problem.tags.length ? (
          <div className="flex flex-wrap items-center gap-1.5">
            {problem.patterns.map((pattern) => (
              <Badge
                key={pattern.id}
                variant="accent"
                aria-label={`Pattern: ${pattern.name}`}
              >
                {pattern.name}
              </Badge>
            ))}
            {problem.tags.map((tag) => (
              <Badge key={tag.id} variant="subtle" aria-label={`Tag: ${tag.name}`}>
                #{tag.name}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted/70">No patterns or tags yet.</p>
        )}

        <p className="text-xs text-muted/80">Updated {formatDate(problem.updated_at)}</p>
      </CardContent>
    </Card>
  );
}

export default async function ProblemsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const filters = parseFilters(params);
  const hasFilters = Boolean(
    filters.q ||
      filters.platform ||
      filters.category ||
      filters.pattern ||
      filters.tag ||
      filters.difficulty ||
      filters.status
  );

  const [problems, total, dbCategories, dbPlatforms, patterns, tags] =
    await Promise.all([
      listProblemsFiltered(filters),
      countProblems(),
      listDistinctCategories(),
      listDistinctPlatforms(),
      listPatterns(),
      listTags(),
    ]);

  // Merge what is in the database with the curated option lists.
  const categories = [
    ...new Set([...dbCategories, ...CATEGORY_OPTIONS]),
  ].sort((a, b) => a.localeCompare(b));
  const platforms = [...new Set([...dbPlatforms, ...PLATFORM_OPTIONS])].sort((a, b) =>
    a.localeCompare(b)
  );

  return (
    <div className="flex flex-col gap-7">
      <header className="flex flex-col gap-4 border-b border-border pb-6">
        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">
            Library
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-ink">
            Problems
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-muted">
            Every problem you learn from, with the patterns and tags that make
            it easier to recognise next time.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <NewProblemButton patterns={patterns} tags={tags} />
          <Link
            href="/tags"
            className="text-sm font-medium text-accent hover:text-indigo-300"
          >
            Browse tags <span aria-hidden>→</span>
          </Link>
        </div>
      </header>

      <section aria-label="Search and filters" className="flex flex-col">
        <ProblemFilters
          platforms={platforms}
          categories={categories}
          patterns={patterns}
          tags={tags}
          resultCount={problems.length}
        />
      </section>

      <section aria-label="Problem results" className="flex flex-col gap-3">
        {problems.length ? (
          <div className="grid gap-3">
            {problems.map((problem) => (
              <ProblemCard key={problem.id} problem={problem} />
            ))}
          </div>
        ) : hasFilters ? (
          <EmptyState
            emoji="🔍"
            title="No problems match these filters"
            description="Try a broader search, or clear a filter or two — the library is still there."
            action={
              <Link
                href="/problems"
                className="text-sm font-medium text-accent hover:text-indigo-300"
              >
                Clear filters →
              </Link>
            }
          />
        ) : (
          <EmptyState
            emoji="📚"
            title="Create your first problem"
            description="Start with the problem you are working on right now. Title, platform, difficulty, and the patterns you suspect — the rest grows as you learn."
            action={<NewProblemButton patterns={patterns} tags={tags} />}
          />
        )}
      </section>

      <footer className="border-t border-border pt-5">
        <p className="text-xs text-muted">
          <span
            className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 align-middle"
            aria-hidden
          />
          {`${problems.length} of ${total} ${
            total === 1 ? "problem" : "problems"
          } shown — results and counts come straight from Cloudflare D1.`}
        </p>
      </footer>
    </div>
  );
}
