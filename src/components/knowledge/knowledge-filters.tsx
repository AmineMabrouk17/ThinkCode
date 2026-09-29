"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";

import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  NOTE_TYPE_EMOJI,
  NOTE_TYPE_LABELS,
  NOTE_TYPE_PLURALS,
  NOTE_TYPES,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { NoteType, NoteTypeCounts } from "@/types";

/**
 * Type filter + search for the knowledge base. Both live in the URL
 * (`?type=&q=`) so a view is shareable and server-rendered; the search box
 * debounces and pushes, exactly like the problem library filters.
 */
export function KnowledgeFilters({
  counts,
  resultCount,
}: {
  counts: NoteTypeCounts;
  resultCount: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const activeType = searchParams.get("type") ?? "";
  const urlQuery = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(urlQuery);
  const [syncedQuery, setSyncedQuery] = useState(urlQuery);

  // Adopt the URL when it changes from the outside (chip click, back/forward).
  if (urlQuery !== syncedQuery) {
    setSyncedQuery(urlQuery);
    setQuery(urlQuery);
  }

  const navigate = useCallback(
    (patch: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(patch)) {
        if (value === null || value === "") params.delete(key);
        else params.set(key, value);
      }
      const href = params.toString() ? `/knowledge?${params.toString()}` : "/knowledge";
      startTransition(() => {
        router.push(href);
      });
    },
    [router, searchParams]
  );

  // Debounce the search box, then push it into the URL.
  useEffect(() => {
    if (query === urlQuery) return;
    const timer = setTimeout(() => {
      navigate({ q: query.trim() || null });
    }, 300);
    return () => clearTimeout(timer);
  }, [navigate, query, urlQuery]);

  const hasFilters = Boolean(activeType || urlQuery.trim());

  function hrefFor(type: string) {
    const params = new URLSearchParams();
    if (type) params.set("type", type);
    if (urlQuery.trim()) params.set("q", urlQuery.trim());
    const queryString = params.toString();
    return queryString ? `/knowledge?${queryString}` : "/knowledge";
  }

  const chipClass = (active: boolean) =>
    cn(
      "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
      active
        ? "border-accent/40 bg-accent/15 text-indigo-200"
        : "border-border bg-surface-2 text-muted hover:text-ink"
    );

  const total = Object.values(counts).reduce((sum, n) => sum + n, 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex flex-1 flex-col gap-1.5">
          <label htmlFor="knowledge-search" className="text-xs font-medium text-muted">
            Search
          </label>
          <Input
            id="knowledge-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search note titles, contents, and problems…"
            autoComplete="off"
          />
        </div>
        <div className="flex items-center gap-2">
          {isPending ? <Spinner label="Updating…" /> : null}
          {hasFilters ? (
            <Link
              href="/knowledge"
              className="rounded-lg px-2 py-2 text-xs font-medium text-accent hover:text-indigo-300"
            >
              Clear filters
            </Link>
          ) : null}
        </div>
      </div>

      <nav aria-label="Filter notes by type" className="flex flex-col gap-2">
        <p className="text-xs font-medium text-muted">Type</p>
        <ul className="flex flex-wrap items-center gap-2">
          <li>
            <Link
              href={hrefFor("")}
              className={chipClass(!activeType)}
              aria-current={!activeType ? "true" : undefined}
            >
              All <span className="font-mono text-muted/70">{total}</span>
            </Link>
          </li>
          {NOTE_TYPES.map((type) => (
            <li key={type}>
              <Link
                href={hrefFor(type)}
                className={chipClass(activeType === type)}
                aria-current={activeType === type ? "true" : undefined}
              >
                <span aria-hidden>{NOTE_TYPE_EMOJI[type]}</span>{" "}
                {NOTE_TYPE_PLURALS[type]}{" "}
                <span className="font-mono text-muted/70">{counts[type] ?? 0}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <p className="text-xs text-muted" aria-live="polite">
        {resultCount} {resultCount === 1 ? "note" : "notes"} shown
        {activeType && NOTE_TYPE_LABELS[activeType as NoteType]
          ? ` · filtered to ${NOTE_TYPE_LABELS[activeType as NoteType].toLowerCase()}s`
          : " · every note in your base"}
      </p>
    </div>
  );
}
