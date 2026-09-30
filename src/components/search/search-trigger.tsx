"use client";

import { useCallback, useEffect, useState } from "react";

import { SearchDialog } from "@/components/search/search-dialog";
import { cn } from "@/lib/utils";

/**
 * The header's search entry point: a fake input that is really a button, so the
 * app looks like it has a search field before anything is typed, and a ⌘K
 * shortcut for the people who would rather not aim at it.
 *
 * The ⌘K listener lives here rather than in the dialog so the trigger can be the
 * single owner of `open`, and so a keystroke never reaches the page underneath
 * while the palette is up.
 */
export function SearchTrigger({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);

  const openPalette = useCallback(() => setOpen(true), []);
  const closePalette = useCallback(() => setOpen(false), []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((value) => !value);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={openPalette}
        aria-haspopup="dialog"
        aria-label="Search everything (Command K)"
        className={cn(
          "group flex h-9 w-full items-center gap-2 rounded-lg border border-border bg-surface px-3 text-left text-sm text-muted transition-colors",
          "hover:border-accent/50 hover:text-ink focus-visible:border-accent/60",
          className
        )}
      >
        <svg
          className="pointer-events-none h-4 w-4 shrink-0 text-muted"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <span className="min-w-0 flex-1 truncate">
          Search your knowledge base…
        </span>
        <kbd className="hidden shrink-0 rounded border border-border bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] text-muted sm:inline">
          ⌘K
        </kbd>
      </button>

      <SearchDialog open={open} onClose={closePalette} />
    </>
  );
}
