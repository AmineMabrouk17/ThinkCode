"use client";

import { useState, useTransition } from "react";

import { deleteResourceAction } from "@/app/problems/resource-actions";
import { ResourceForm } from "@/components/resources/resource-form";
import { YouTubePlayer } from "@/components/resources/youtube-player";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Spinner } from "@/components/ui/spinner";
import { RESOURCE_LABELS, RESOURCE_TYPE_EMOJI } from "@/lib/constants";
import { urlHost, youtubeId } from "@/lib/resource-utils";
import { formatDate } from "@/lib/utils";
import type { Resource } from "@/types";

/**
 * One attached resource: for a video the thumbnail (and an inline player that
 * only loads when you press play), for everything else the type badge, then the
 * title, the creator, what it covers, and your own reason for saving it.
 *
 * The note is the part that is actually yours: the video is somebody else's
 * explanation, the reason you kept it belongs to you.
 */
export function ResourceCard({
  problemId,
  resource,
}: {
  problemId: string;
  resource: Resource;
}) {
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // A "youtube" resource whose link is not a video link (hand-edited row, or a
  // playlist) still shows as a video, just without a preview.
  const videoId = youtubeId(resource.url);
  const host = urlHost(resource.url);

  function remove() {
    setError(null);
    startTransition(async () => {
      const result = await deleteResourceAction(problemId, resource.id);
      if (result.ok) setConfirming(false);
      else setError(result.error ?? "Could not delete this resource.");
    });
  }

  return (
    <>
      <Card className="transition-colors hover:border-accent/40">
        <CardContent className="flex flex-col gap-4 py-4">
          <div className="flex flex-col gap-4 sm:flex-row">
            {videoId ? (
              <YouTubePlayer videoId={videoId} title={resource.title} />
            ) : null}

            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="accent"
                  aria-label={`Type: ${RESOURCE_LABELS[resource.type]}`}
                >
                  <span aria-hidden>{RESOURCE_TYPE_EMOJI[resource.type]}</span>{" "}
                  {RESOURCE_LABELS[resource.type]}
                </Badge>
                {resource.creator ? (
                  <Badge variant="subtle" aria-label={`Creator: ${resource.creator}`}>
                    {resource.creator}
                  </Badge>
                ) : null}
                <span className="text-xs text-muted/80">
                  Added {formatDate(resource.created_at)}
                </span>
              </div>

              <span className="text-sm font-medium text-ink">{resource.title}</span>

              {resource.description ? (
                <p className="text-sm leading-relaxed text-muted">
                  {resource.description}
                </p>
              ) : null}

              {resource.notes ? (
                <div className="rounded-lg border border-border bg-surface-2/40 px-4 py-3">
                  <span className="text-xs font-semibold uppercase tracking-widest text-muted">
                    Why I saved it
                  </span>
                  <p className="mt-1 text-sm leading-relaxed text-ink">
                    {resource.notes}
                  </p>
                </div>
              ) : null}

              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={`Open ${resource.title} in a new tab`}
                >
                  <Button variant="outline" size="sm">
                    {resource.type === "youtube" ? "Watch" : "Read"} {" "}
                    <span aria-hidden>↗</span>
                  </Button>
                </a>
                {host ? (
                  <span className="truncate font-mono text-xs text-muted/70">
                    {host}
                  </span>
                ) : null}
                <div className="ml-auto flex items-center gap-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditing(true)}
                    aria-label={`Edit the resource ${resource.title}`}
                  >
                    <span aria-hidden>✏️</span> Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirming(true)}
                    aria-label={`Delete the resource ${resource.title}`}
                    className="px-2 text-muted hover:text-rose-400"
                  >
                    <span aria-hidden>🗑</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Modal
        open={editing}
        onClose={() => setEditing(false)}
        title={`Edit — ${resource.title}`}
      >
        <ResourceForm
          problemId={problemId}
          mode="edit"
          resource={resource}
          onSuccess={() => setEditing(false)}
        />
      </Modal>

      <Modal
        open={confirming}
        onClose={() => setConfirming(false)}
        title="Delete resource"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm leading-relaxed text-muted">
            This removes the <span className="text-ink">{resource.title}</span>{" "}
            link from this problem. The explanation itself stays on YouTube or
            wherever it lives — only your bookmark and your note are deleted. It
            cannot be undone.
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
              Delete resource
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
