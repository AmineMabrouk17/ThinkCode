import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getProblemDetail, getProblemRecords, listPatterns, listTags } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { KnowledgeSection } from "@/components/knowledge/knowledge-section";
import {
  ProblemHeaderActions,
  ProblemStatusControl,
} from "@/components/problems/problem-header-actions";
import { ProblemSection } from "@/components/problems/problem-sections";
import { AiConversations } from "@/components/resources/ai-conversations";
import { ResourceSection } from "@/components/resources/resource-section";
import { ReviewHistorySection } from "@/components/review/review-history-section";
import { ThinkingSessions } from "@/components/thinking/thinking-sessions";
import { SolutionSection } from "@/components/solutions/solution-section";
import { VisualizationSection } from "@/components/visualizations/visualization-section";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { DifficultyBadge } from "@/components/ui/difficulty-badge";
import { StatusBadge } from "@/components/ui/status-badge";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const problem = await getProblemDetail(id);
  return {
    title: problem ? problem.title : "Problem",
  };
}

export default async function ProblemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [problem, patterns, tags, records] = await Promise.all([
    getProblemDetail(id),
    listPatterns(),
    listTags(),
    getProblemRecords(id),
  ]);

  if (!problem) notFound();

  return (
    <div className="flex flex-col gap-7">
      {/* Header */}
      <header className="flex flex-col gap-5">
        <Link
          href="/problems"
          className="w-fit text-sm font-medium text-accent hover:text-indigo-300"
        >
          <span aria-hidden>←</span> Problems
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
                  <Badge
                    key={tag.id}
                    variant="subtle"
                    aria-label={`Tag: ${tag.name}`}
                  >
                    #{tag.name}
                  </Badge>
                ))}
              </div>
            ) : null}

            <div className="flex flex-wrap items-end justify-between gap-4 border-t border-border pt-4">
              <ProblemHeaderActions
                problem={problem}
                patterns={patterns}
                tags={tags}
              />
              <ProblemStatusControl problemId={problem.id} status={problem.status} />
            </div>
          </CardContent>
        </Card>

        <p className="text-xs text-muted/80">
          Added {formatDate(problem.created_at)} · Last updated{" "}
          {formatDate(problem.updated_at)}
        </p>
      </header>

      {/* THINK */}
      <ProblemSection
        id="section-think"
        emoji="🧠"
        title="THINK"
        hint="Think independently before asking AI."
      >
        <ThinkingSessions problemId={problem.id} sessions={records.sessions} />
      </ProblemSection>

      {/* AI */}
      <ProblemSection
        id="section-ai"
        emoji="💬"
        title="AI"
        hint="ThinkCode stores the link, not the conversation — your thinking stays yours."
      >
        <AiConversations
          problemId={problem.id}
          conversations={records.aiConversations}
        />
      </ProblemSection>

      {/* UNDERSTAND */}
      <ProblemSection
        id="section-understand"
        emoji="📊"
        title="UNDERSTAND"
        hint="Diagrams, tables, and animated traces of the algorithm."
      >
        <VisualizationSection
          problemId={problem.id}
          visualizations={records.visualizations}
        />
      </ProblemSection>

      {/* KNOWLEDGE */}
      <ProblemSection
        id="section-knowledge"
        emoji="📝"
        title="KNOWLEDGE"
        hint="The condensed explanation future-you comes back for."
      >
        <KnowledgeSection problemId={problem.id} notes={records.notes} />
      </ProblemSection>

      {/* RESOURCES */}
      <ProblemSection
        id="section-resources"
        emoji="🎥"
        title="RESOURCES"
        hint="Explanations worth revisiting, with your own reason for saving them."
      >
        <ResourceSection problemId={problem.id} resources={records.resources} />
      </ProblemSection>

      {/* SOLUTION */}
      <ProblemSection
        id="section-solution"
        emoji="💻"
        title="SOLUTION"
        hint="Kept separate from your thinking on purpose."
      >
        <SolutionSection problemId={problem.id} solutions={records.solutions} />
      </ProblemSection>

      {/* REFLECT */}
      <ProblemSection
        id="section-reflect"
        emoji="🔄"
        title="REFLECT"
        hint="How your answer compared with the one you would have given today."
      >
        <ReviewHistorySection problemId={problem.id} reviews={records.reviews} />
      </ProblemSection>
    </div>
  );
}
