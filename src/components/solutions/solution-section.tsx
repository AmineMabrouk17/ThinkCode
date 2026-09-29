"use client";

import { useState } from "react";

import { SolutionCard } from "@/components/solutions/solution-card";
import { SolutionForm } from "@/components/solutions/solution-form";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import type { Solution } from "@/types";

/**
 * The SOLUTION section of a problem page: every final implementation you kept,
 * with the editor to add another.
 *
 * It lives below the THINK section on purpose. The product rule is that a
 * solution never overwrites your original reasoning — the two are separate
 * tables, and this is the place where the answer goes.
 */
export function SolutionSection({
  problemId,
  solutions,
}: {
  problemId: string;
  solutions: Solution[];
}) {
  const [adding, setAdding] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted">
          Stored separately from your thinking — your first ideas stay untouched above.
        </p>
        <Button onClick={() => setAdding(true)}>＋ Add solution</Button>
      </div>

      {solutions.length ? (
        <div className="flex flex-col gap-3">
          {solutions.map((solution) => (
            <SolutionCard key={solution.id} problemId={problemId} solution={solution} />
          ))}
        </div>
      ) : (
        <EmptyState
          emoji="💻"
          title="No solution stored yet"
          description="No solution stored yet — write it after you've understood it."
          className="py-8"
        />
      )}

      <Modal
        open={adding}
        onClose={() => setAdding(false)}
        title="New solution"
        className="max-h-[85vh] max-w-3xl overflow-y-auto"
      >
        <SolutionForm
          problemId={problemId}
          mode="create"
          onSuccess={() => setAdding(false)}
        />
      </Modal>
    </div>
  );
}
