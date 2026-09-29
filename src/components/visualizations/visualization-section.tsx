"use client";

import { useState } from "react";

import { VisualizationCard } from "@/components/visualizations/visualization-card";
import { VisualizationForm } from "@/components/visualizations/visualization-form";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import type { Visualization } from "@/types";

/**
 * The UNDERSTAND section of a problem page: every drawing that made the
 * algorithm click.
 *
 * Three kinds live side by side on purpose — a Mermaid flowchart for the logic,
 * a monospace sketch for the walk you can only see in your head, and a link to
 * a screenshot for the graph you drew in another tool. All three belong to the
 * problem, which is the point: the picture is the understanding, kept next to
 * the question that produced it.
 */
export function VisualizationSection({
  problemId,
  visualizations,
}: {
  problemId: string;
  visualizations: Visualization[];
}) {
  const [adding, setAdding] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted">
          Draw the part your head kept skipping — a Mermaid flowchart, a
          monospace walk, or a link to a picture you made elsewhere.
        </p>
        <Button onClick={() => setAdding(true)}>＋ Add visualization</Button>
      </div>

      {visualizations.length ? (
        <ul className="flex flex-col gap-3">
          {visualizations.map((visualization) => (
            <li key={visualization.id}>
              <VisualizationCard
                problemId={problemId}
                visualization={visualization}
              />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          emoji="📊"
          title="No visualizations yet — draw the part your head kept skipping"
          description="No visualizations yet — draw the part your head kept skipping. A flowchart, a two-pointer walk, or a link to your own sketch."
          className="py-8"
        />
      )}

      <Modal
        open={adding}
        onClose={() => setAdding(false)}
        title="New visualization"
        className="max-h-[85vh] max-w-3xl overflow-y-auto"
      >
        <VisualizationForm
          problemId={problemId}
          mode="create"
          onSuccess={() => setAdding(false)}
        />
      </Modal>
    </div>
  );
}
