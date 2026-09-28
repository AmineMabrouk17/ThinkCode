import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  getPatternBySlug,
  getPatternProblems,
  listPatternsByCategory,
} from "@/lib/db";
import { splitSignals } from "@/lib/pattern-utils";
import { MentalModelEditor } from "@/components/patterns/mental-model-editor";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DifficultyBadge } from "@/components/ui/difficulty-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const pattern = await getPatternBySlug(slug);
  return { title: pattern ? pattern.name : "Pattern" };
}

function KnowledgeCard({
  emoji,
  title,
  count,
  children,
}: {
  emoji: string;
  title: string;
  count?: number;
  children: React.ReactNode;
}) {
  const titleId = `section-${title.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline gap-2">
        <h2
          id={titleId}
          className="text-base font-semibold tracking-tight text-ink"
        >
          <span aria-hidden>{emoji} </span>
          {title}
        </h2>
        {count !== undefined ? (
          <Badge variant="subtle" aria-label={`${count} ${title.toLowerCase()}`}>
            {count}
          </Badge>
        ) : null}
      </div>
      <Card>
        <CardContent className="py-4">{children}</CardContent>
      </Card>
    </section>
  );
}

export default async function PatternPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const pattern = await getPatternBySlug(slug);
  if (!pattern) notFound();

  const [problems, related, signals] = await Promise.all([
    getPatternProblems(slug),
    pattern.category
      ? listPatternsByCategory(pattern.category, pattern.slug)
      : Promise.resolve([]),
    Promise.resolve(splitSignals(pattern.common_signals)),
  ]);

  return (
    <div className="flex flex-col gap-7">
      <header className="flex flex-col gap-5">
        <Link
          href="/patterns"
          className="w-fit text-sm font-medium text-accent hover:text-indigo-300"
        >
          <span aria-hidden>←</span> Patterns
        </Link>

        <div className="flex flex-col gap-3 border-b border-border pb-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="accent" aria-label={`Category: ${pattern.category}`}>
              {pattern.category}
            </Badge>
            <Badge
              variant="subtle"
              aria-label={`${problems.length} problems use this pattern`}
            >
              {problems.length} {problems.length === 1 ? "problem" : "problems"}
            </Badge>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            {pattern.name}
          </h1>
          {pattern.description ? (
            <p className="max-w-3xl text-sm leading-relaxed text-muted">
              {pattern.description}
            </p>
          ) : null}
        </div>
      </header>

      <KnowledgeCard emoji="🧠" title="Mental model">
        <MentalModelEditor
          patternId={pattern.id}
          slug={pattern.slug}
          initialValue={pattern.mental_model}
        />
      </KnowledgeCard>

      <KnowledgeCard emoji="🔎" title="Common signals" count={signals.length}>
        {signals.length ? (
          <ul className="flex flex-col gap-2" aria-label="Common signals">
            {signals.map((signal) => (
              <li
                key={signal}
                className="flex items-start gap-2 text-sm leading-relaxed text-ink"
              >
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
                {signal}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            emoji="🔎"
            title="No signals written yet"
            description="The phrases you notice in a problem statement that tell you to reach for this pattern."
            className="py-6"
          />
        )}
      </KnowledgeCard>

      <KnowledgeCard emoji="📚" title="Problems" count={problems.length}>
        {problems.length ? (
          <ul className="grid gap-2 sm:grid-cols-2">
            {problems.map((problem) => (
              <li
                key={problem.id}
                className="flex flex-col gap-1.5 rounded-lg border border-border bg-surface-2/40 px-3 py-2.5"
              >
                <Link
                  href={`/problems/${problem.id}`}
                  className="font-medium text-ink hover:text-accent"
                >
                  {problem.title}
                </Link>
                <div className="flex flex-wrap items-center gap-1.5">
                  <DifficultyBadge difficulty={problem.difficulty} />
                  <StatusBadge status={problem.status} />
                  {problem.category ? (
                    <span className="text-xs text-muted">{problem.category}</span>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            emoji="📚"
            title="No problems linked yet"
            description="Open a problem in your library and tag it with this pattern — it shows up here."
            className="py-6"
            action={
              <Link
                href="/problems"
                className="text-sm font-medium text-accent hover:text-indigo-300"
              >
                Browse the library →
              </Link>
            }
          />
        )}
      </KnowledgeCard>

      <section aria-labelledby="section-related-patterns" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-baseline gap-2">
          <h2
            id="section-related-patterns"
            className="text-base font-semibold tracking-tight text-ink"
          >
            <span aria-hidden>🔗 </span>
            Related patterns
          </h2>
          {pattern.category ? (
            <Badge variant="subtle">{pattern.category}</Badge>
          ) : null}
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-muted">
              Other patterns in this category
            </CardTitle>
          </CardHeader>
          <CardContent>
            {related.length ? (
              <ul className="flex flex-col gap-2">
                {related.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface-2/40 px-3 py-2.5"
                  >
                    <Link
                      href={`/patterns/${item.slug}`}
                      className="text-sm font-medium text-ink hover:text-accent"
                    >
                      {item.name}
                    </Link>
                    <Badge variant="subtle">
                      {item.problem_count}{" "}
                      {item.problem_count === 1 ? "problem" : "problems"}
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm leading-relaxed text-muted">
                {pattern.category
                  ? `“${pattern.category}” is the only pattern in this category so far.`
                  : "This pattern has no category, so there is nothing to compare it to."}
              </p>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
