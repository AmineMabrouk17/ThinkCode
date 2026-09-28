import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Preferences"
        title="Settings"
        description="Configuration for your learning workspace."
      />
      <EmptyState
        emoji="⚙️"
        title="Settings coming soon"
        description="Thinking timer defaults, review intervals, appearance, and data management will live here."
        action={null}
      />
    </div>
  );
}