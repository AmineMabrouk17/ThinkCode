import { countProblems } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function ProblemsPage() {
  const problemCount = await countProblems();

  return (
    <div>
      <PageHeader
        eyebrow="Library"
        title="Problems"
        description="The heart of ThinkCode. This page will let you create, edit, tag, and filter your algorithm problem library."
      />
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Badge variant="accent">
          {problemCount} problem{problemCount === 1 ? "" : "s"} in the database
        </Badge>
        <Badge variant="subtle">Search & filters</Badge>
        <Badge variant="subtle">Create / edit</Badge>
      </div>
      <EmptyState
        emoji="📚"
        title="Problem library coming soon"
        description="The next feature will bring full problem CRUD: title, platform, external URL, difficulty, category, status, tags, and patterns — with search and filtering on top."
        action={
          <span className="text-xs text-muted">
            Seeded with 10 example problems, ready to browse.
          </span>
        }
      />
    </div>
  );
}