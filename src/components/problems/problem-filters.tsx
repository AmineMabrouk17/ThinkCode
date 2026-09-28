"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";

import {
  DIFFICULTIES,
  DIFFICULTY_LABELS,
  PROBLEM_STATUSES,
  STATUS_LABELS,
} from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import type { Pattern, Tag } from "@/types";

/** Every filter lives in the URL so a view is shareable and server-rendered. */
export const FILTER_KEYS = [
  "q",
  "platform",
  "difficulty",
  "category",
  "pattern",
  "status",
  "tag",
] as const;

export type FilterOption = { value: string; label: string };

function toOptions(values: string[]): FilterOption[] {
  return values.map((value) => ({ value, label: value }));
}

function useFilterNavigation() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const navigate = useCallback(
    (patch: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(patch)) {
        if (value === null || value === "") params.delete(key);
        else params.set(key, value);
      }
      const query = params.toString();
      const href = query ? `/problems?${query}` : "/problems";
      startTransition(() => {
        router.push(href);
      });
    },
    [router, searchParams]
  );

  return { isPending, navigate };
}

export function ProblemFilters({
  platforms,
  categories,
  patterns,
  tags,
  resultCount,
}: {
  platforms: string[];
  categories: string[];
  patterns: Pattern[];
  tags: Tag[];
  /** Number of rows the current filters matched. */
  resultCount: number;
}) {
  const searchParams = useSearchParams();
  const { isPending, navigate } = useFilterNavigation();

  const active = useMemo(() => {
    const current: Record<string, string> = {};
    for (const key of FILTER_KEYS) {
      const value = searchParams.get(key);
      if (value) current[key] = value;
    }
    return current;
  }, [searchParams]);

  const urlQuery = active.q ?? "";
  const [query, setQuery] = useState(urlQuery);
  const [syncedQuery, setSyncedQuery] = useState(urlQuery);

  // Adopt the URL when it changes from the outside (clear filters, back/forward).
  // Adjusting state during render is the documented alternative to an effect.
  if (urlQuery !== syncedQuery) {
    setSyncedQuery(urlQuery);
    setQuery(urlQuery);
  }

  // Debounce the search box, then push it into the URL.
  useEffect(() => {
    if (query === urlQuery) return;
    const timer = setTimeout(() => {
      navigate({ q: query.trim() || null });
    }, 300);
    return () => clearTimeout(timer);
  }, [navigate, query, urlQuery]);

  const hasFilters = Object.keys(active).length > 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex flex-1 flex-col gap-1.5">
          <label htmlFor="problem-search" className="text-xs font-medium text-muted">
            Search
          </label>
          <Input
            id="problem-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search titles and descriptions…"
            autoComplete="off"
          />
        </div>
        <div className="flex items-center gap-2">
          {isPending ? <Spinner label="Updating…" /> : null}
          {hasFilters ? (
            <Link
              href="/problems"
              className="rounded-lg px-2 py-2 text-xs font-medium text-accent hover:text-indigo-300"
            >
              Clear filters
            </Link>
          ) : null}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <FilterSelect
          id="filter-platform"
          label="Platform"
          value={active.platform ?? ""}
          options={toOptions(platforms)}
          onChange={(value) => navigate({ platform: value || null })}
        />
        <FilterSelect
          id="filter-difficulty"
          label="Difficulty"
          value={active.difficulty ?? ""}
          options={DIFFICULTIES.map((difficulty) => ({
            value: difficulty,
            label: DIFFICULTY_LABELS[difficulty],
          }))}
          onChange={(value) => navigate({ difficulty: value || null })}
        />
        <FilterSelect
          id="filter-category"
          label="Category"
          value={active.category ?? ""}
          options={toOptions(categories)}
          onChange={(value) => navigate({ category: value || null })}
        />
        <FilterSelect
          id="filter-pattern"
          label="Pattern"
          value={active.pattern ?? ""}
          options={patterns.map((pattern) => ({
            value: pattern.slug,
            label: pattern.name,
          }))}
          onChange={(value) => navigate({ pattern: value || null })}
        />
        <FilterSelect
          id="filter-status"
          label="Status"
          value={active.status ?? ""}
          options={PROBLEM_STATUSES.map((status) => ({
            value: status,
            label: STATUS_LABELS[status],
          }))}
          onChange={(value) => navigate({ status: value || null })}
        />
        <FilterSelect
          id="filter-tag"
          label="Tag"
          value={active.tag ?? ""}
          options={tags.map((tag) => ({ value: tag.slug, label: `#${tag.name}` }))}
          onChange={(value) => navigate({ tag: value || null })}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="accent">
          {resultCount} {resultCount === 1 ? "problem" : "problems"}
        </Badge>
        {hasFilters ? (
          <Badge variant="subtle">Filtered from your URL</Badge>
        ) : (
          <Badge variant="subtle">All statuses, difficulties, patterns</Badge>
        )}
      </div>
    </div>
  );
}

function FilterSelect({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-medium text-muted">
        {label}
      </label>
      <Select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">All {label.toLowerCase()}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    </div>
  );
}
