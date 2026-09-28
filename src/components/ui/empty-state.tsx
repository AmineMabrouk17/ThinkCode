import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function EmptyState({
  emoji,
  title,
  description,
  action,
  className,
}: {
  emoji: string;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-surface/50 px-6 py-16 text-center",
        className
      )}
    >
      <span
        className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-surface-2 text-2xl"
        aria-hidden
      >
        {emoji}
      </span>
      <h3 className="text-lg font-semibold tracking-tight text-ink">{title}</h3>
      {description ? (
        <p className="max-w-md text-sm leading-relaxed text-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}