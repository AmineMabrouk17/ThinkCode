"use client";

import { useState, useTransition } from "react";

import { deleteThinkingSessionAction } from "@/app/problems/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { Spinner } from "@/components/ui/spinner";
import { formatDateTime, formatSessionDuration } from "@/lib/utils";
import { ThinkingTimer } from "@/components/thinking/thinking-timer";
import type { ThinkingSession } from "@/types";

/**
 * The body of the problem page's THINK section: the timer entry point plus the
 * history of sessions. The rows arrive from the server component, so a save or
 * a delete only shows up once `revalidatePath` has shipped a fresh payload.
 */
export function ThinkingSessions({
  problemId,
  sessions,
}: {
  problemId: string;
  sessions: ThinkingSession[];
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ThinkingTimer problemId={problemId} />
        <p className="text-xs text-muted">
          15-minute default, configurable — think before you ask.
        </p>
      </div>

      {sessions.length ? (
        <ul className="flex flex-col gap-2">
          {sessions.map((session) => (
            <li key={session.id}>
              <ThinkingSessionCard problemId={problemId} session={session} />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          emoji="⏱️"
          title="No thinking sessions yet"
          description="No thinking sessions yet — start your first 15 minutes."
          className="py-8"
        />
      )}
    </div>
  );
}

/** One past session: when, how long, the thoughts (collapsed), and a delete. */
function ThinkingSessionCard({
  problemId,
  session,
}: {
  problemId: string;
  session: ThinkingSession;
}) {
  const [expanded, setExpanded] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const thoughts = session.thoughts?.trim() ?? "";
  const duration = formatSessionDuration(session.duration_seconds);

  function remove() {
    setError(null);
    startTransition(async () => {
      const result = await deleteThinkingSessionAction(problemId, session.id);
      if (result.ok) setConfirming(false);
      else setError(result.error ?? "Could not delete this thinking session.");
    });
  }

  return (
    <>
      <Card>
        <CardContent className="flex flex-col gap-3 py-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="truncate text-sm font-medium text-ink">
                {formatDateTime(session.started_at)}
              </span>
              <span className="text-xs text-muted">
                {thoughts
                  ? `${thoughts.split("\n").length} lines of initial thoughts`
                  : "No thoughts written"}
              </span>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <Badge
                className="font-mono tabular-nums"
                aria-label={`Duration: ${duration}`}
              >
                {duration}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirming(true)}
                aria-label={`Delete the thinking session from ${formatDateTime(session.started_at)}`}
                className="px-2 text-muted hover:text-rose-400"
              >
                <span aria-hidden>🗑</span>
              </Button>
            </div>
          </div>

          {thoughts ? (
            <>
              <button
                type="button"
                onClick={() => setExpanded((value) => !value)}
                aria-expanded={expanded}
                className="w-fit text-xs font-medium text-muted transition-colors hover:text-ink"
              >
                {expanded ? "Hide thoughts" : "Show thoughts"}
              </button>
              {expanded ? (
                <p className="whitespace-pre-wrap rounded-lg border border-border bg-surface-2 px-3 py-2 font-mono text-sm leading-relaxed text-ink">
                  {thoughts}
                </p>
              ) : null}
            </>
          ) : null}
        </CardContent>
      </Card>

      <Modal
        open={confirming}
        onClose={() => setConfirming(false)}
        title="Delete thinking session"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm leading-relaxed text-muted">
            This deletes the{" "}
            <span className="text-ink">{formatDateTime(session.started_at)}</span>{" "}
            session ({duration}) and the thoughts you wrote during it. It cannot be
            undone.
          </p>
          {error ? (
            <p role="alert" className="text-xs text-rose-400">
              {error}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center justify-end gap-2">
            {pending ? <Spinner label="Deleting…" /> : null}
            <Button variant="ghost" onClick={() => setConfirming(false)} disabled={pending}>
              Keep it
            </Button>
            <Button variant="danger" onClick={remove} disabled={pending}>
              Delete session
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
