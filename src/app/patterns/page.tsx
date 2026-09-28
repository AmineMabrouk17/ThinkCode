import type { Metadata } from "next";
import Link from "next/link";

import {
  countPatterns,
  listPatternCategories,
  listPatternsWithCounts,
} from "@/lib/db";
import { NewPatternButton } from "@/components/patterns/new-pattern-button";
import { PatternCategoryChips } from "@/components/patterns/pattern-category-chips";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import type { PatternWithCount } from "@/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Patterns",
  description:
    "Your catalogue of algorithmic patterns — mental models, common signals, and the problems each one unlocks.",
};

/** Read the single `category` search param; anything else is ignored. */
function parseCategory(
  searchParams: Record<string, string | string[] | undefined>
): string | undefined {
  const value = searchParams.category;
  return (Array.isArray(value) ? value[0] : value)?.trim() || undefined;
}

/** First non-empty line of the mental model, else the description. */
function snippet(pattern: PatternWithCount): string | null {
  const source = pattern.mental_model || pattern.description;
  if (!source) return null;
  return (
    source
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find(Boolean) ?? null
  );
}

function PatternCard({ pattern }: { pattern: PatternWithCount }) {
  const summary = snippet(pattern);

  return (
    <Card className="transition-colors hover:border-accent/40">
      <CardContent className="flex h-full flex-col gap-3 py-4">
        <div className="flex flex-col gap-1.5">
          <Link
            href={`/patterns/${pattern.slug}`}
            className="font-medium text-ink hover:text-accent"
          >
            {pattern.name}
          </Link>
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="accent" aria-label={`Category: ${pattern.category}`}>
              {pattern.category}
            </Badge>
            <Badge variant="subtle" aria-label={`${pattern.problem_count} problems using this pattern`}>
              {pattern.problem_count}{" "}
              {pattern.problem_count === 1 ? "problem" : "problems"}
            </Badge>
          </div>
        </div>

        {summary ? (
          <p className="line-clamp-2 text-xs leading-relaxed text-muted">
            {summary}
          </p>
        ) : (
          <p className="text-xs text-muted/70">
            No mental model written yet — open the page to add one.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default async function PatternsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const category = parseCategory(await searchParams);

  const [patterns, categories, patternCount] = await Promise.all([
    listPatternsWithCounts(category),
    listPatternCategories(),
    countPatterns(),
  ]);

  const total = patterns.reduce((sum, pattern) => sum + pattern.problem_count, 0);

  return (
    <div className="flex flex-col gap-7">
      <header className="flex flex-col gap-4 border-b border-border pb-6">
        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">
            Concepts
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-ink">
            <span aria-hidden>🧠 </span>
            Patterns
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-muted">
            The shapes your solutions keep taking. Each one gets a page with your
            mental model, the signals that point to it, and every problem you
            solved with it.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <NewPatternButton categories={categories} />
          <Link
            href="/tags"
            className="text-sm font-medium text-accent hover:text-indigo-300"
          >
            Browse tags <span aria-hidden>→</span>
          </Link>
        </div>
      </header>

      <section aria-label="Pattern filters" className="flex flex-col">
        <PatternCategoryChips categories={categories} active={category} />
      </section>

      <section aria-label="Pattern results" className="flex flex-col gap-3">
        {patterns.length ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {patterns.map((pattern) => (
              <PatternCard key={pattern.id} pattern={pattern} />
            ))}
          </div>
        ) : categories.length ? (
          <EmptyState
            emoji="🔍"
            title="No patterns in this category"
            description="Nothing catalogued here yet — pick another category, or add the first pattern here."
            action={
              <Link
                href="/patterns"
                className="text-sm font-medium text-accent hover:text-indigo-300"
              >
                Show all patterns →
              </Link>
            }
          />
        ) : (
          <EmptyState
            emoji="🧠"
            title="Catalogue your first pattern"
            description="Name a shape you keep recognising — HashMap, Two Pointers, Sliding Window — and give it a page you can come back to."
            action={<NewPatternButton categories={categories} />}
          />
        )}
      </section>

      <footer className="border-t border-border pt-5">
        <p className="text-xs text-muted">
          <span
            className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 align-middle"
            aria-hidden
          />
          {`${patterns.length} of ${patternCount} ${
            patternCount === 1 ? "pattern" : "patterns"
          } shown — ${total} problem link${total === 1 ? "" : "s"} across them, straight from Cloudflare D1.`}
        </p>
      </footer>
    </div>
  );
}
