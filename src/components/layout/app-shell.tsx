"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { SearchTrigger } from "@/components/search/search-trigger";
import { cn } from "@/lib/utils";

const NAV_ITEMS: { href: string; emoji: string; label: string }[] = [
  { href: "/", emoji: "🏠", label: "Dashboard" },
  { href: "/problems", emoji: "📚", label: "Problems" },
  { href: "/patterns", emoji: "🧠", label: "Patterns" },
  { href: "/knowledge", emoji: "📝", label: "Knowledge" },
  { href: "/review", emoji: "🔄", label: "Review" },
  { href: "/settings", emoji: "⚙️", label: "Settings" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

function Brand() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2.5 rounded-lg focus-visible:outline-none"
    >
      <span
        className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 text-base shadow-sm shadow-indigo-950/40"
        aria-hidden
      >
        🧠
      </span>
      <span className="text-base font-semibold tracking-tight text-ink">
        ThinkCode
      </span>
    </Link>
  );
}

function NavLink({
  href,
  emoji,
  label,
  pathname,
}: {
  href: string;
  emoji: string;
  label: string;
  pathname: string;
}) {
  const active = isActive(pathname, href);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-accent/10 text-ink ring-1 ring-inset ring-accent/30"
          : "text-muted hover:bg-surface-2 hover:text-ink"
      )}
    >
      <span aria-hidden className="text-base leading-none">
        {emoji}
      </span>
      {label}
    </Link>
  );
}

function HeaderBar() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="flex h-14 items-center justify-between gap-4 px-4 lg:px-8">
        <div className="lg:hidden">
          <Brand />
        </div>
        <div className="hidden flex-1 lg:block">
          <SearchTrigger className="max-w-xs" />
        </div>
        <div className="flex items-center gap-2 lg:hidden">
          <SearchTrigger className="max-w-44" />
        </div>
        <div className="hidden items-center gap-2 sm:flex">
          <span
            className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-300"
            title="Local D1 connected via wrangler proxy"
          >
            <span
              className="h-1.5 w-1.5 rounded-full bg-emerald-400"
              aria-hidden
            />
            DB connected
          </span>
        </div>
      </div>
    </header>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background text-ink">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-border bg-surface/50 lg:flex">
        <div className="flex h-14 items-center border-b border-border px-5">
          <Brand />
        </div>
        <nav aria-label="Primary" className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.href} {...item} pathname={pathname} />
          ))}
        </nav>
        <div className="border-t border-border p-4">
          <p className="text-xs leading-relaxed text-muted">
            <span className="font-medium text-ink">Think first.</span>
            <br />
            Understand deeply. Remember forever.
          </p>
        </div>
      </aside>

      {/* Main column */}
      <div className="min-h-screen lg:pl-64">
        <HeaderBar />

        {/* Mobile nav */}
        <nav
          aria-label="Primary"
          className="flex gap-1 overflow-x-auto border-b border-border bg-surface/40 px-3 py-2 lg:hidden"
        >
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.href} {...item} pathname={pathname} />
          ))}
        </nav>

        <main className="mx-auto w-full max-w-5xl px-4 py-8 lg:px-8 lg:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}