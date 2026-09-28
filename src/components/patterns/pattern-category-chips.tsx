import Link from "next/link";

import { cn } from "@/lib/utils";

/**
 * Category filter for the pattern library. Every chip is a plain link, so the
 * active category lives in the URL and the filtered view is server-rendered
 * and shareable.
 */
export function PatternCategoryChips({
  categories,
  active,
}: {
  categories: string[];
  /** The category currently selected, if any. */
  active?: string;
}) {
  const current = active?.toLowerCase();

  const chipClass = (isActive: boolean) =>
    cn(
      "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
      isActive
        ? "border-accent/40 bg-accent/15 text-indigo-200"
        : "border-border bg-surface-2 text-muted hover:text-ink"
    );

  return (
    <nav aria-label="Filter patterns by category" className="flex flex-col gap-2">
      <p className="text-xs font-medium text-muted">Category</p>
      <ul className="flex flex-wrap items-center gap-2">
        <li>
          <Link
            href="/patterns"
            className={chipClass(!current)}
            aria-current={!current ? "true" : undefined}
          >
            All
          </Link>
        </li>
        {categories.map((category) => {
          const isActive = current === category.toLowerCase();
          const query = new URLSearchParams({ category });
          return (
            <li key={category}>
              <Link
                href={`/patterns?${query.toString()}`}
                className={chipClass(isActive)}
                aria-current={isActive ? "true" : undefined}
              >
                {category}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
