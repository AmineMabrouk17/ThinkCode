"use client";

import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";

import { highlightSegments } from "@/lib/search-utils";
import { NoteTypeBadge } from "@/components/knowledge/note-type-badge";
import { Badge } from "@/components/ui/badge";
import { DifficultyBadge } from "@/components/ui/difficulty-badge";
import { Spinner } from "@/components/ui/spinner";
import { StatusBadge } from "@/components/ui/status-badge";
import type {
  NoteSearchHit,
  PatternSearchHit,
  ProblemSearchHit,
  SearchGroup,
  SearchHit,
} from "@/types";

/** Debounce: long enough to stop typing, short enough to feel immediate. */
const DEBOUNCE_MS = 180;

/** Below this, the query is too short to be worth a round-trip. */
const MIN_QUERY = 2;

/** A result row, ready to render — no per-kind branching inside the list. */
type PaletteItem = {
  key: string;
  href: string;
  title: string;
  subtitle: string;
  excerpt?: string;
  badges: Array<{ key: string; node: React.ReactNode }>;
};

/** Results carry the term they answer, so a stale answer is never shown. */
type Results = { term: string; groups: SearchGroup[]; truncated: boolean };

const NO_RESULTS: Results = { term: "", groups: [], truncated: false };

export function SearchDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Results>(NO_RESULTS);
  const [active, setActive] = useState(0);
  const [pending, startTransition] = useTransition();

  // The term the in-flight request was issued for. When the answer lands it is
  // compared against this, so a slow response for "hash" can never overwrite the
  // results for "hash map" typed after it.
  const issuedFor = useRef("");

  // Opening focuses the input; closing is handled by `close`, which also drops
  // the query so the next open starts clean.
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    const term = query.trim();
    if (term.length < MIN_QUERY) return;

    const timer = setTimeout(() => {
      issuedFor.current = term;
      startTransition(async () => {
        const response = await fetch(`/api/search?q=${encodeURIComponent(term)}`);
        if (!response.ok || issuedFor.current !== term) return;

        const data = (await response.json()) as {
          groups: SearchGroup[];
          truncated?: boolean;
        };
        setResults({ term, groups: data.groups, truncated: Boolean(data.truncated) });
        setActive(0);
      });
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query]);

  const close = useCallback(() => {
    setQuery("");
    setResults(NO_RESULTS);
    setActive(0);
    issuedFor.current = "";
    onClose();
  }, [onClose]);

  // Anything answered for a different term is stale — including results from
  // before the query was shortened, which is why this is derived rather than
  // cleared in an effect.
  const term = query.trim();
  const fresh = term.length >= MIN_QUERY && results.term === term;
  const groups = useMemo(
    () => (fresh ? results.groups : []),
    [fresh, results.groups]
  );
  const items = useMemo(
    () => groups.flatMap((group) => group.items.map(toItem)),
    [groups]
  );

  const openItem = useCallback(
    (item: PaletteItem) => {
      close();
      router.push(item.href);
    },
    [close, router]
  );

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => (items.length ? (index + 1) % items.length : 0));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) =>
        items.length ? (index - 1 + items.length) % items.length : 0
      );
    } else if (event.key === "Enter") {
      event.preventDefault();
      const item = items[active];
      if (item) openItem(item);
    } else if (event.key === "Escape") {
      event.preventDefault();
      close();
    }
  }

  // Keep the highlighted row in view while arrowing through a long list.
  useEffect(() => {
    listRef.current
      ?.querySelector(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [active, items.length]);

  if (!open) return null;

  let cursor = -1;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]">
      <button
        type="button"
        aria-label="Close search"
        className="absolute inset-0 cursor-default bg-background/80 backdrop-blur-sm"
        onClick={close}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search everything"
        className="relative flex w-full max-w-xl flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-2xl shadow-black/50"
      >
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <span aria-hidden className="text-muted">
            ⌕
          </span>
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search problems, knowledge, patterns…"
            aria-label="Search problems, knowledge, and patterns"
            role="combobox"
            aria-expanded={items.length > 0}
            aria-controls="search-results"
            className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted/70"
          />
          {pending ? <Spinner label="Searching…" /> : null}
        </div>

        <div
          ref={listRef}
          id="search-results"
          role="listbox"
          aria-label="Search results"
          className="max-h-[55vh] overflow-y-auto p-2"
        >
          {term.length < MIN_QUERY ? (
            <p className="px-3 py-6 text-center text-sm text-muted">
              Type {MIN_QUERY} characters or more. Search looks at problem titles
              and descriptions, your notes, and your patterns.
            </p>
          ) : items.length ? (
            groups.map((group) => (
              <div key={group.kind} className="mb-2 last:mb-0">
                <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-muted">
                  {group.label}
                </p>
                {group.items.map((hit) => {
                  const item = toItem(hit);
                  cursor += 1;
                  const index = cursor;
                  const selected = index === active;

                  return (
                    <button
                      key={item.key}
                      type="button"
                      data-index={index}
                      role="option"
                      aria-selected={selected}
                      onClick={() => openItem(item)}
                      onMouseMove={() => setActive(index)}
                      className={`flex w-full flex-col gap-1 rounded-lg px-3 py-2 text-left transition-colors ${
                        selected ? "bg-accent/15" : "hover:bg-surface-2"
                      }`}
                    >
                      <span className="flex flex-wrap items-center gap-2">
                        <Highlighted
                          text={item.title}
                          term={term}
                          className="text-sm text-ink"
                        />
                        {item.badges.map((badge) => (
                          <span key={badge.key}>{badge.node}</span>
                        ))}
                      </span>
                      <span className="text-xs text-muted">{item.subtitle}</span>
                      {item.excerpt ? (
                        <Highlighted
                          text={item.excerpt}
                          term={term}
                          className="text-xs leading-relaxed text-muted/90"
                        />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            ))
          ) : pending ? (
            <p className="px-3 py-6 text-center text-sm text-muted">Searching…</p>
          ) : (
            <p className="px-3 py-6 text-center text-sm text-muted">
              Nothing matches “{term}”. Try a word you remember from your notes
              rather than a title.
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-2 text-xs text-muted">
          <span className="flex items-center gap-2">
            <kbd className="rounded border border-border bg-surface-2 px-1.5 py-0.5 font-mono text-[10px]">
              ↑
            </kbd>
            <kbd className="rounded border border-border bg-surface-2 px-1.5 py-0.5 font-mono text-[10px]">
              ↓
            </kbd>
            to move
            <kbd className="rounded border border-border bg-surface-2 px-1.5 py-0.5 font-mono text-[10px]">
              ↵
            </kbd>
            to open
          </span>
          <span>
            {items.length
              ? `${items.length} result${items.length === 1 ? "" : "s"}`
              : ""}
            {fresh && results.truncated ? " · best matches shown" : ""}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * One result row. The three kinds share a shape so the list never branches: where
 * it goes, what to call it, what sits next to it, and a sentence of context
 * underneath.
 */
function toItem(hit: SearchHit): PaletteItem {
  if ("platform" in hit) return problemItem(hit);
  if ("problem_id" in hit) return noteItem(hit);
  return patternItem(hit);
}

function problemItem(hit: ProblemSearchHit): PaletteItem {
  return {
    key: `problem-${hit.id}`,
    href: `/problems/${hit.id}`,
    title: hit.title,
    subtitle: `${hit.category} · ${hit.platform}`,
    badges: [
      { key: "difficulty", node: <DifficultyBadge difficulty={hit.difficulty} /> },
      { key: "status", node: <StatusBadge status={hit.status} /> },
    ],
  };
}

function noteItem(hit: NoteSearchHit): PaletteItem {
  return {
    key: `note-${hit.id}`,
    href: `/problems/${hit.problem_id}#section-knowledge`,
    title: hit.title,
    subtitle: hit.problem_title,
    excerpt: hit.excerpt,
    badges: [{ key: "type", node: <NoteTypeBadge type={hit.type} /> }],
  };
}

function patternItem(hit: PatternSearchHit): PaletteItem {
  return {
    key: `pattern-${hit.id}`,
    href: `/patterns/${hit.slug}`,
    title: hit.name,
    subtitle: hit.category,
    excerpt: hit.description ?? undefined,
    badges: [{ key: "kind", node: <Badge variant="subtle">Pattern</Badge> }],
  };
}

/**
 * Renders `text` with every occurrence of `term` wrapped in a `<mark>`.
 *
 * The split comes from `highlightSegments`, so nothing is ever injected as HTML —
 * a note containing `<script>` renders as the characters the user typed.
 */
function Highlighted({
  text,
  term,
  className,
}: {
  text: string;
  term: string;
  className?: string;
}) {
  const segments = highlightSegments(text, term);

  return (
    <span className={className}>
      {segments.map((segment, index) =>
        segment.match ? (
          <mark key={index} className="rounded bg-accent/25 px-0.5 text-ink">
            {segment.text}
          </mark>
        ) : (
          <span key={index}>{segment.text}</span>
        )
      )}
    </span>
  );
}
