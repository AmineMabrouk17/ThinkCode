"use client";

import { useState } from "react";

import { ResourceCard } from "@/components/resources/resource-card";
import { ResourceForm } from "@/components/resources/resource-form";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import type { Resource } from "@/types";

/**
 * The RESOURCES section of a problem page: every explanation you decided was
 * worth a second visit, each one kept next to your own reason for saving it.
 *
 * Videos get a thumbnail and an inline player; articles and plain links get
 * their type badge. Either way the row is a pointer to somebody else's
 * explanation, and the note under it is the part that belongs to you.
 */
export function ResourceSection({
  problemId,
  resources,
}: {
  problemId: string;
  resources: Resource[];
}) {
  const [adding, setAdding] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted">
          Save the explanation that finally made it click — the link plus the
          reason you kept it.
        </p>
        <Button onClick={() => setAdding(true)}>＋ Add resource</Button>
      </div>

      {resources.length ? (
        <ul className="flex flex-col gap-3">
          {resources.map((resource) => (
            <li key={resource.id}>
              <ResourceCard problemId={problemId} resource={resource} />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          emoji="🎥"
          title="No resources attached yet"
          description="No resources attached yet — save the explanation that finally made it click."
          className="py-8"
        />
      )}

      <Modal
        open={adding}
        onClose={() => setAdding(false)}
        title="New resource"
      >
        <ResourceForm
          problemId={problemId}
          mode="create"
          onSuccess={() => setAdding(false)}
        />
      </Modal>
    </div>
  );
}
