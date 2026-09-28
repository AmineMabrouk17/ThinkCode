import { countPatterns } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function PatternsPage() {
  const patternCount = await countPatterns();

  return (
    <div>
      <PageHeader
        eyebrow="Concepts"
        title="Patterns"
        description="Your catalogue of algorithmic patterns — mental models, common signals, and the problems they unlock."
      />
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Badge variant="accent">
          {patternCount} pattern{patternCount === 1 ? "" : "s"} catalogued
        </Badge>
        <Badge variant="subtle">Mental models</Badge>
        <Badge variant="subtle">Common signals</Badge>
      </div>
      <EmptyState
        emoji="🧠"
        title="Pattern pages coming soon"
        description="Each pattern will get its own knowledge page — why it works, which signals point to it, and your personal mental model for it."
        action={
          <span className="text-xs text-muted">
            Seeded with HashMap, Two Pointers, Sliding Window, DFS, and more.
          </span>
        }
      />
    </div>
  );
}