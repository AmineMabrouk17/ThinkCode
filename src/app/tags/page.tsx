import type { Metadata } from "next";
import Link from "next/link";

import { listTagCounts } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tags",
  description:
    "Every tag across your problem library, with how many problems carry it.",
};

export default async function TagsPage() {
  const tags = await listTagCounts();

  const tagged = tags.filter((tag) => tag.problem_count > 0);
  const totalLinks = tags.reduce((sum, tag) => sum + tag.problem_count, 0);

  return (
    <div className="flex flex-col gap-7">
      <header className="flex flex-col gap-4 border-b border-border pb-6">
        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">
            Organisation
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-ink">
            <span aria-hidden>🏷️ </span>
            Tags
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-muted">
            The free-form labels you sprinkle on problems. A tag is a note to
            yourself: “needs-review”, “mistake”, “important”.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/problems"
            className="text-sm font-medium text-accent hover:text-indigo-300"
          >
            <span aria-hidden>←</span> Problems
          </Link>
        </div>
      </header>

      <section aria-label="Tags" className="flex flex-col gap-3">
        {tags.length ? (
          <Card>
            <CardContent className="py-5">
              <ul className="flex flex-wrap items-center gap-2">
                {tags.map((tag) => (
                  <li key={tag.id}>
                    <Link
                      href={`/problems?tag=${encodeURIComponent(tag.slug)}`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-2 px-3 py-1 text-xs font-medium text-muted transition-colors hover:border-accent/40 hover:text-ink"
                      aria-label={`Tag: ${tag.name}, ${tag.problem_count} ${
                        tag.problem_count === 1 ? "problem" : "problems"
                      }`}
                    >
                      <span aria-hidden>#</span>
                      {tag.name}
                      <span className="font-mono text-muted/70">
                        {tag.problem_count}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ) : (
          <EmptyState
            emoji="🏷️"
            title="No tags yet"
            description="Tags are created from the problem form — pick an existing one or type a new name and it appears here."
            action={
              <Link
                href="/problems"
                className="text-sm font-medium text-accent hover:text-indigo-300"
              >
                Browse the library →
              </Link>
            }
          />
        )}
      </section>

      <footer className="border-t border-border pt-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="accent">
            {tags.length} {tags.length === 1 ? "tag" : "tags"}
          </Badge>
          <Badge variant="subtle">
            {tagged.length} in use
          </Badge>
          <p className="text-xs text-muted">
            {totalLinks} problem {totalLinks === 1 ? "link" : "links"} across
            every tag — counts come straight from Cloudflare D1.
          </p>
        </div>
      </footer>
    </div>
  );
}
