"use client";

import Link from "next/link";
import { useState } from "react";

import { Markdown } from "@/components/knowledge/markdown";
import { NoteTypeBadge } from "@/components/knowledge/note-type-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { formatDate } from "@/lib/utils";
import type { NoteWithProblem } from "@/types";

/**
 * One row of the personal knowledge base: the type badge, the title, the
 * problem it came from, a plain-text excerpt, and a Read toggle that opens the
 * fully rendered markdown in a modal.
 */
export function KnowledgeNoteCard({
  note,
  excerpt,
}: {
  note: NoteWithProblem;
  /** Plain-text, markdown-stripped preview of the note body. */
  excerpt: string;
}) {
  const [reading, setReading] = useState(false);

  return (
    <>
      <Card className="transition-colors hover:border-accent/40">
        <CardContent className="flex flex-col gap-3 py-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex min-w-0 flex-col gap-1">
              <h2 className="truncate text-sm font-medium text-ink">
                {note.problem_title}
              </h2>
              <p className="truncate text-xs text-muted/80">
                {note.title} · Updated {formatDate(note.updated_at)}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <NoteTypeBadge type={note.type} />
              <Button variant="ghost" size="sm" onClick={() => setReading(true)}>
                Read
              </Button>
            </div>
          </div>

          <p className="line-clamp-2 text-xs leading-relaxed text-muted">
            {excerpt}
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/problems/${note.problem_id}#section-knowledge`}
              className="text-xs font-medium text-accent hover:text-indigo-300"
            >
              Open problem <span aria-hidden>→</span>
            </Link>
          </div>
        </CardContent>
      </Card>

      <Modal
        open={reading}
        onClose={() => setReading(false)}
        title={note.title}
        className="max-h-[85vh] max-w-2xl overflow-y-auto"
      >
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <NoteTypeBadge type={note.type} />
            <Link
              href={`/problems/${note.problem_id}#section-knowledge`}
              className="text-xs font-medium text-accent hover:text-indigo-300"
            >
              {note.problem_title} <span aria-hidden>→</span>
            </Link>
            <span className="text-xs text-muted/80">
              Updated {formatDate(note.updated_at)}
            </span>
          </div>
          <div className="rounded-lg border border-border bg-surface-2 px-4 py-3">
            <Markdown content={note.content} />
          </div>
        </div>
      </Modal>
    </>
  );
}
