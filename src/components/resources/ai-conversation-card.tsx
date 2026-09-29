"use client";

import { useState, useTransition } from "react";

import { deleteAiConversationAction } from "@/app/problems/resource-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Spinner } from "@/components/ui/spinner";
import { AI_PROVIDER_EMOJI } from "@/lib/constants";
import { urlHost } from "@/lib/resource-utils";
import { formatDate } from "@/lib/utils";
import type { AiConversation } from "@/types";

/**
 * One saved AI conversation: which tool it came from, what the discussion was
 * about, your own reason for keeping it, and a link straight back to it.
 *
 * There is no transcript here on purpose — the card is a bookmark with a
 * memory attached, so ThinkCode never becomes a wall of pasted chat text.
 */
export function AiConversationCard({
  problemId,
  conversation,
}: {
  problemId: string;
  conversation: AiConversation;
}) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const host = urlHost(conversation.url);

  function remove() {
    setError(null);
    startTransition(async () => {
      const result = await deleteAiConversationAction(problemId, conversation.id);
      if (result.ok) setConfirming(false);
      else setError(result.error ?? "Could not delete this conversation link.");
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
                  aria-label={`Provider: ${conversation.provider}`}
                >
                  <span aria-hidden>{AI_PROVIDER_EMOJI[conversation.provider]}</span>{" "}
                  {conversation.provider}
                </Badge>
                <span className="text-xs text-muted/80">
                  Saved {formatDate(conversation.created_at)}
                </span>
              </div>
              <span className="text-sm font-medium text-ink">
                {conversation.title}
              </span>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirming(true)}
              aria-label={`Delete the link ${conversation.title}`}
              className="shrink-0 px-2 text-muted hover:text-rose-400"
            >
              <span aria-hidden>🗑</span>
            </Button>
          </div>

          {conversation.description ? (
            <div className="rounded-lg border border-border bg-surface-2/40 px-4 py-3">
              <span className="text-xs font-semibold uppercase tracking-widest text-muted">
                Why I saved this
              </span>
              <p className="mt-1 text-sm leading-relaxed text-ink">
                {conversation.description}
              </p>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            <a
              href={conversation.url}
              target="_blank"
              rel="noreferrer noopener"
              aria-label={`Open the conversation ${conversation.title} in a new tab`}
            >
              <Button variant="outline" size="sm">
                Open conversation <span aria-hidden>↗</span>
              </Button>
            </a>
            {host ? (
              <span className="truncate font-mono text-xs text-muted/70">{host}</span>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Modal
        open={confirming}
        onClose={() => setConfirming(false)}
        title="Delete conversation link"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm leading-relaxed text-muted">
            This removes the <span className="text-ink">{conversation.title}</span>{" "}
            link from this problem. The conversation itself stays in{" "}
            {conversation.provider} — only the bookmark is deleted. It cannot be
            undone.
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
              Delete link
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
