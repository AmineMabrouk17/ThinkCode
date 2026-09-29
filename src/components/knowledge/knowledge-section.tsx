"use client";

import { useState } from "react";

import { NOTE_TYPES, NOTE_TYPE_EMOJI, NOTE_TYPE_LABELS } from "@/lib/constants";
import { NoteCard } from "@/components/knowledge/note-card";
import { NoteForm } from "@/components/knowledge/note-form";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import type { Note } from "@/types";

/**
 * The KNOWLEDGE section of a problem page: the condensed explanation future-you
 * comes back for, grouped by note type so mental models, key lessons, and
 * mistakes each read as their own list.
 *
 * Rows arrive from the server component, so a save or a delete only shows up
 * once `revalidatePath` has shipped a fresh payload.
 */
export function KnowledgeSection({
  problemId,
  notes,
}: {
  problemId: string;
  notes: Note[];
}) {
  const [adding, setAdding] = useState(false);

  const grouped = NOTE_TYPES.map((type) => ({
    type,
    items: notes.filter((note) => note.type === type),
  })).filter((group) => group.items.length > 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted">
          Markdown notes — the mental model, the lesson, and the mistake you do not
          want to repeat.
        </p>
        <Button onClick={() => setAdding(true)}>＋ Add note</Button>
      </div>

      {notes.length ? (
        <div className="flex flex-col gap-5">
          {grouped.map((group) => (
            <section
              key={group.type}
              aria-label={`${NOTE_TYPE_LABELS[group.type]} notes`}
              className="flex flex-col gap-2"
            >
              <div className="flex items-baseline gap-2">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-muted">
                  <span aria-hidden>{NOTE_TYPE_EMOJI[group.type]}</span>{" "}
                  {NOTE_TYPE_LABELS[group.type]}
                </h3>
                <span className="font-mono text-xs text-muted/60">
                  {group.items.length}
                </span>
              </div>
              <ul className="flex flex-col gap-2">
                {group.items.map((note) => (
                  <li key={note.id}>
                    <NoteCard problemId={problemId} note={note} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <EmptyState
          emoji="📝"
          title="No knowledge captured yet"
          description="No knowledge captured yet — write the mental model you want to keep."
          className="py-8"
        />
      )}

      <Modal
        open={adding}
        onClose={() => setAdding(false)}
        title="New knowledge note"
        className="max-h-[85vh] max-w-3xl overflow-y-auto"
      >
        <NoteForm problemId={problemId} mode="create" onSuccess={() => setAdding(false)} />
      </Modal>
    </div>
  );
}
