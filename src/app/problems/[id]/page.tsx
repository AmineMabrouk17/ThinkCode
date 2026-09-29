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
import {
  ProblemSection,
  ReadOnlyRows,
  SectionPlaceholder,
  type ReadOnlyRowData,
} from "@/components/problems/problem-sections";
import { ThinkingSessions } from "@/components/thinking/thinking-sessions";
import { SolutionSection } from "@/components/solutions/solution-section";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { DifficultyBadge } from "@/components/ui/difficulty-badge";
import { StatusBadge } from "@/components/ui/status-badge";
import type { ResourceType, VisualizationType } from "@/types";

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

const RESOURCE_LABELS: Record<ResourceType, string> = {
  youtube: "YouTube",
  article: "Article",
  other: "Link",
};

const VISUALIZATION_LABELS: Record<VisualizationType, string> = {
  mermaid: "Mermaid",
  image: "Image",
  diagram: "Diagram",
};

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

  const aiRows: ReadOnlyRowData[] = records.aiConversations.map((ai) => ({
    id: ai.id,
    title: ai.title,
    meta: `${ai.provider} · ${formatDate(ai.created_at)}`,
    badge: "Open ↗",
    href: ai.url,
  }));

  const resourceRows: ReadOnlyRowData[] = records.resources.map((resource) => ({
    id: resource.id,
    title: resource.title,
    meta: `${formatDate(resource.created_at)}${
      resource.notes ? " · with your note" : ""
    }`,
    badge: RESOURCE_LABELS[resource.type],
    href: resource.url,
  }));

  const visualizationRows: ReadOnlyRowData[] = records.visualizations.map(
    (visualization) => ({
      id: visualization.id,
      title: visualization.title,
      meta: formatDate(visualization.created_at),
      badge: VISUALIZATION_LABELS[visualization.type],
    })
  );

  const reviewRows: ReadOnlyRowData[] = records.reviews.map((review) => ({
    id: review.id,
    title: review.thoughts ?? "Review without notes",
    meta: `Reviewed ${formatDate(review.reviewed_at)}${
      review.elapsed_days ? ` · ${review.elapsed_days} days later` : ""
    }`,
    badge:
      review.confidence === null ? "No score" : `Confidence ${review.confidence}/5`,
  }));

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
        hint="Links only — the conversation itself stays in ChatGPT / AI Studio."
      >
        {aiRows.length ? (
          <ReadOnlyRows
            items={aiRows}
            note="Resources adds AI conversations, with a provider and why you saved it."
          />
        ) : (
          <SectionPlaceholder
            emoji="💬"
            title="No AI conversations linked"
            description="AI conversation links arrive with Resources."
          />
        )}
      </ProblemSection>

      {/* UNDERSTAND */}
      <ProblemSection
        id="section-understand"
        emoji="📊"
        title="UNDERSTAND"
        hint="Diagrams, tables, and animated traces of the algorithm."
      >
        {visualizationRows.length ? (
          <ReadOnlyRows
            items={visualizationRows}
            note="the Visualization feature renders Mermaid, images, and custom diagrams."
          />
        ) : (
          <SectionPlaceholder
            emoji="📊"
            title="No visualizations yet"
            description="Visualizations arrive with the Visualization feature."
          />
        )}
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
        {resourceRows.length ? (
          <ReadOnlyRows
            items={resourceRows}
            note="Resources lets you add YouTube links with titles, creators, and personal notes."
          />
        ) : (
          <SectionPlaceholder
            emoji="🎥"
            title="No resources saved"
            description="YouTube & external resources arrive with Resources."
          />
        )}
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
        {reviewRows.length ? (
          <ReadOnlyRows
            items={reviewRows}
            note="the Review feature adds spaced repetition and old-vs-new reasoning."
          />
        ) : (
          <SectionPlaceholder
            emoji="🔄"
            title="Never reviewed"
            description="Review history & spaced repetition arrive with the Review feature."
          />
        )}
      </ProblemSection>
    </div>
  );
}
