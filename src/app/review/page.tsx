import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function ReviewPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Remember"
        title="Review"
        description="Revisit old problems before you peek at your notes. Your reasoning now is compared against your reasoning then."
      />
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Badge variant="subtle">🟡 Learning</Badge>
        <Badge variant="subtle">🔵 Due for review</Badge>
        <Badge variant="subtle">Spaced repetition</Badge>
      </div>
      <EmptyState
        emoji="🔄"
        title="Review queue coming soon"
        description="This is where ThinkCode asks you to re-solve a problem from memory — reinforcing what you actually understand instead of what you crammed."
        action={null}
      />
    </div>
  );
}