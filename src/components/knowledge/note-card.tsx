"use client";

import { useState, useTransition } from "react";

import { deleteNoteAction } from "@/app/knowledge/notes-actions";
import { Markdown } from "@/components/knowledge/markdown";
import { NoteForm } from "@/components/knowledge/note-form";
import { NoteTypeBadge } from "@/components/knowledge/note-type-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Spinner } from "@/components/ui/spinner";
import { formatDate } from "@/lib/utils";
import type { Note } from "@/types";

/**
 * One note: its type badge, title, the day it was last touched, and a Read
 * toggle that expands the rendered markdown in place. Edit and Delete sit
 * behind the card so the list stays calm until you reach for it.
 */
export function NoteCard({ problemId, note }: { problemId: string; note: Note }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function remove() {
    setError(null);
    startTransition(async () => {
      const result = await deleteNoteAction(problemId, note.id);
      if (result.ok) setConfirming(false);
      else setError(result.error ?? "Could not delete this note.");
    });
  }

  return (
    <>
      <Card className="transition-colors hover:border-accent/40">
        <CardContent className="flex flex-col gap-3 py-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex min-w-0 flex-col gap-1">
              <span className="text-sm font-medium text-ink">{note.title}</span>
              <div className="flex flex-wrap items-center gap-1.5">
                <NoteTypeBadge type={note.type} />
                <span className="text-xs text-muted/80">
                  Updated {formatDate(note.updated_at)}
                </span>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpanded((value) => !value)}
                aria-expanded={expanded}
                aria-controls={`note-body-${note.id}`}
              >
                {expanded ? "Hide" : "Read"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditing(true)}
                aria-label={`Edit the note ${note.title}`}
              >
                <span aria-hidden>✏️</span> Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirming(true)}
                aria-label={`Delete the note ${note.title}`}
                className="px-2 text-muted hover:text-rose-400"
              >
                <span aria-hidden>🗑</span>
              </Button>
            </div>
          </div>

          {expanded ? (
            <div
              id={`note-body-${note.id}`}
              className="rounded-lg border border-border bg-surface-2 px-4 py-3"
            >
              <Markdown content={note.content} />
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Modal
        open={editing}
        onClose={() => setEditing(false)}
        title={`Edit — ${note.title}`}
        className="max-h-[85vh] max-w-3xl overflow-y-auto"
      >
        <NoteForm
          problemId={problemId}
          mode="edit"
          note={note}
          onSuccess={() => setEditing(false)}
        />
      </Modal>

      <Modal
        open={confirming}
        onClose={() => setConfirming(false)}
        title="Delete note"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm leading-relaxed text-muted">
            This deletes the <span className="text-ink">{note.title}</span> note.
            It cannot be undone.
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
              Delete note
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
