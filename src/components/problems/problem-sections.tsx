import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

/**
 * The problem page is the heart of ThinkCode: one ordered stack of sections,
 * from the raw thinking to the final solution. Later features fill each
 * section in; until then every section is data-driven — if the problem already
 * has rows, they are listed read-only.
 */

export function ProblemSection({
  id,
  emoji,
  title,
  hint,
  children,
}: {
  id: string;
  emoji: string;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline gap-2">
        <h2
          id={id}
          className="text-base font-semibold tracking-tight text-ink"
        >
          <span aria-hidden>{emoji}</span> {title}
        </h2>
        {hint ? <p className="text-xs text-muted">{hint}</p> : null}
      </div>
      {children}
    </section>
  );
}

export type ReadOnlyRowData = {
  id: string;
  title: string;
  /** Secondary line: date, provider, complexity, … */
  meta: string;
  /** Small right-aligned label. */
  badge?: string;
  badgeClassName?: string;
  /** When set, the title becomes an external link. */
  href?: string;
};

/** A compact read-only list of whatever already exists for a section. */
export function ReadOnlyRows({
  items,
  note,
}: {
  items: ReadOnlyRowData[];
  note: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-col gap-2">
        {items.map((item) => {
          const body = (
            <>
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="truncate text-sm font-medium text-ink">
                  {item.title}
                </span>
                <span className="truncate text-xs text-muted">{item.meta}</span>
              </div>
              {item.badge ? (
                <Badge
                  className={cn("shrink-0", item.badgeClassName)}
                  aria-label={`Type: ${item.badge}`}
                >
                  {item.badge}
                </Badge>
              ) : null}
            </>
          );

          return (
            <li
              key={item.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface px-3 py-2.5"
            >
              {item.href ? (
                <a
                  href={item.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="flex min-w-0 flex-1 items-center justify-between gap-3"
                >
                  {body}
                </a>
              ) : (
                <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
                  {body}
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <p className="text-xs text-muted/80">Read-only for now — {note}</p>
    </div>
  );
}

/** Section placeholder used while a section has no rows yet. */
export function SectionPlaceholder({
  emoji,
  title,
  description,
}: {
  emoji: string;
  title: string;
  description: string;
}) {
  return (
    <EmptyState emoji={emoji} title={title} description={description} className="py-8" />
  );
}
