"use client";

import { useState, useTransition } from "react";

import { deleteVisualizationAction } from "@/app/problems/visualization-actions";
import { MermaidDiagram } from "@/components/visualizations/mermaid-diagram";
import { VisualizationForm } from "@/components/visualizations/visualization-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Spinner } from "@/components/ui/spinner";
import { VISUALIZATION_TYPE_EMOJI } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import {
  visualizationBadgeLabel,
  visualizationImageHost,
  visualizationImageUrl,
} from "@/lib/visualization-utils";
import type { Visualization } from "@/types";

/**
 * One visualization: a Mermaid diagram rendered live, a plain-text diagram
 * kept in its monospace box, or a link to an image you drew somewhere else.
 *
 * All three exist for the same reason — something about this algorithm only
 * became obvious once you drew it. The image variant is deliberately just a
 * link: ThinkCode has no upload, so the picture keeps living wherever you made
 * it and only the pointer is stored next to the problem.
 */
export function VisualizationCard({
  problemId,
  visualization,
}: {
  problemId: string;
  visualization: Visualization;
}) {
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const imageUrl = visualizationImageUrl(visualization);
  const imageHost = visualizationImageHost(visualization);

  function remove() {
    setError(null);
    startTransition(async () => {
      const result = await deleteVisualizationAction(problemId, visualization.id);
      if (result.ok) setConfirming(false);
      else setError(result.error ?? "Could not delete this visualization.");
    });
  }

  return (
    <>
      <Card className="transition-colors hover:border-accent/40">
        <CardContent className="flex flex-col gap-3 py-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex min-w-0 flex-col gap-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="accent"
                  aria-label={`Type: ${visualizationBadgeLabel(visualization.type)}`}
                >
                  <span aria-hidden>{VISUALIZATION_TYPE_EMOJI[visualization.type]}</span>{" "}
                  {visualizationBadgeLabel(visualization.type)}
                </Badge>
                <span className="text-xs text-muted/80">
                  Added {formatDate(visualization.created_at)}
                </span>
              </div>
              <span className="text-sm font-medium text-ink">{visualization.title}</span>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditing(true)}
                aria-label={`Edit the visualization ${visualization.title}`}
              >
                <span aria-hidden>✏️</span> Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirming(true)}
                aria-label={`Delete the visualization ${visualization.title}`}
                className="px-2 text-muted hover:text-rose-400"
              >
                <span aria-hidden>🗑</span>
              </Button>
            </div>
          </div>

          {visualization.type === "mermaid" ? (
            <MermaidDiagram code={visualization.content} label={visualization.title} />
          ) : null}

          {visualization.type === "diagram" ? (
            <div className="overflow-hidden rounded-lg border border-border bg-surface-2/40">
              <pre className="overflow-x-auto whitespace-pre px-4 py-3 font-mono text-xs leading-relaxed text-ink">
                {visualization.content}
              </pre>
            </div>
          ) : null}

          {visualization.type === "image" ? (
            <div className="flex flex-col gap-2">
              {imageUrl ? (
                <div className="overflow-hidden rounded-lg border border-border bg-surface-2/40">
                  {/* Plain <img>, not next/image: the host is whatever the user
                      linked to, and a remote allow-list cannot cover that. The
                      URL was normalized to http(s) by the action, and is
                      re-checked by `visualizationImageUrl` before it is used. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageUrl}
                    alt={visualization.title}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="mx-auto block max-h-96 w-auto max-w-full object-contain"
                  />
                </div>
              ) : (
                <p className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-200">
                  This row does not hold a usable http(s) link, so the image
                  cannot be shown. Edit it and paste a full{" "}
                  <code className="font-mono">https://</code> URL.
                </p>
              )}

              <div className="flex flex-wrap items-center gap-2">
                {imageUrl ? (
                  <a
                    href={imageUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label={`Open the image ${visualization.title} in a new tab`}
                  >
                    <Button variant="outline" size="sm">
                      Open image <span aria-hidden>↗</span>
                    </Button>
                  </a>
                ) : null}
                {imageHost ? (
                  <span className="truncate font-mono text-xs text-muted/70">
                    {imageHost}
                  </span>
                ) : null}
                <span className="text-xs text-muted/70">
                  Link only — the picture stays where you drew it.
                </span>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Modal
        open={editing}
        onClose={() => setEditing(false)}
        title={`Edit — ${visualization.title}`}
        className="max-h-[85vh] max-w-3xl overflow-y-auto"
      >
        <VisualizationForm
          problemId={problemId}
          mode="edit"
          visualization={visualization}
          onSuccess={() => setEditing(false)}
        />
      </Modal>

      <Modal
        open={confirming}
        onClose={() => setConfirming(false)}
        title="Delete visualization"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm leading-relaxed text-muted">
            This removes the <span className="text-ink">{visualization.title}</span>{" "}
            drawing from this problem. An image keeps living on the host it was
            linked from — only the link is deleted. It cannot be undone.
          </p>
          {error ? (
            <p role="alert" className="text-xs text-rose-400">
              {error}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center justify-end gap-2">
            {pending ? <Spinner label="Deleting…" /> : null}
            <Button
              variant="ghost"
              onClick={() => setConfirming(false)}
              disabled={pending}
            >
              Keep it
            </Button>
            <Button variant="danger" onClick={remove} disabled={pending}>
              Delete visualization
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
