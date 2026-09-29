import type { Metadata } from "next";
import Link from "next/link";

import { isNoteType, NOTE_TYPE_EMOJI, NOTE_TYPE_LABELS } from "@/lib/constants";
import { countNotesByType, listNotesFiltered } from "@/lib/db";
import { noteExcerpt } from "@/lib/note-utils";
import { KnowledgeFilters } from "@/components/knowledge/knowledge-filters";
import { KnowledgeNoteCard } from "@/components/knowledge/knowledge-note-card";
import { EmptyState } from "@/components/ui/empty-state";
import type { NoteFilters } from "@/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Knowledge",
  description:
    "Your personal knowledge base — every mental model, key lesson, and mistake you condensed into a note.",
};

/** Read the URL into typed filters; unknown enum values are dropped. */
function parseFilters(
  searchParams: Record<string, string | string[] | undefined>
): NoteFilters {
  const one = (key: string) => {
    const value = searchParams[key];
    return (Array.isArray(value) ? value[0] : value)?.trim() || undefined;
  };

  const type = one("type");

  return {
    q: one("q"),
    type: type && isNoteType(type) ? type : undefined,
  };
}

export default async function KnowledgePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const filters = parseFilters(await searchParams);
  const hasFilters = Boolean(filters.q || filters.type);

  const [notes, counts] = await Promise.all([
    listNotesFiltered(filters),
    countNotesByType(),
  ]);

  const total = Object.values(counts).reduce((sum, n) => sum + n, 0);

  return (
    <div className="flex flex-col gap-7">
      <header className="flex flex-col gap-4 border-b border-border pb-6">
        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">
            Knowledge base
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-ink">
            <span aria-hidden>{NOTE_TYPE_EMOJI.general}</span> Knowledge
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-muted">
            Your condensed explanations. Everything you wrote down on a problem
            page — the mental model, the lesson, the mistake — collected in one
            place, searchable forever.
          </p>
        </div>

        {total ? (
          <ul className="flex flex-wrap items-center gap-2" aria-label="Notes per type">
            {(Object.keys(counts) as (keyof typeof counts)[]).map((type) => (
              <li key={type}>
                <Link
                  href={`/knowledge?type=${type}`}
                  className="flex items-center gap-1.5 rounded-full border border-border bg-surface-2 px-3 py-1 text-xs font-medium text-muted transition-colors hover:text-ink"
                  aria-label={`${counts[type]} ${NOTE_TYPE_LABELS[type].toLowerCase()} notes`}
                >
                  <span aria-hidden>{NOTE_TYPE_EMOJI[type]}</span>
                  {NOTE_TYPE_LABELS[type]}
                  <span className="font-mono text-muted/70">{counts[type]}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </header>

      <section aria-label="Search and filters" className="flex flex-col">
        <KnowledgeFilters counts={counts} resultCount={notes.length} />
      </section>

      <section aria-label="Note results" className="flex flex-col gap-3">
        {notes.length ? (
          <div className="flex flex-col gap-3">
            {notes.map((note) => (
              <KnowledgeNoteCard
                key={note.id}
                note={note}
                excerpt={
                  noteExcerpt(note.content) ||
                  "No content written yet — open the problem to add the explanation."
                }
              />
            ))}
          </div>
        ) : hasFilters ? (
          <EmptyState
            emoji="🔍"
            title="No notes match these filters"
            description="Try a broader search, or clear a filter or two — every note is still here."
            action={
              <Link
                href="/knowledge"
                className="text-sm font-medium text-accent hover:text-indigo-300"
              >
                Clear filters →
              </Link>
            }
          />
        ) : (
          <EmptyState
            emoji="📝"
            title="No knowledge captured yet"
            description="Open a problem you have solved, and write the mental model you want to keep. Notes you save there land here automatically."
            action={
              <Link
                href="/problems"
                className="text-sm font-medium text-accent hover:text-indigo-300"
              >
                Browse problems →
              </Link>
            }
          />
        )}
      </section>

      <footer className="border-t border-border pt-5">
        <p className="text-xs text-muted">
          <span
            className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 align-middle"
            aria-hidden
          />
          {`${notes.length} of ${total} ${total === 1 ? "note" : "notes"} shown — every explanation, straight from Cloudflare D1.`}
        </p>
      </footer>
    </div>
  );
}
