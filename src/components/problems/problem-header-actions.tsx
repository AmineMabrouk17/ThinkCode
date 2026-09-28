"use client";

import { useState, useTransition } from "react";

import { deleteProblem, setProblemStatus } from "@/app/problems/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { STATUS_LABELS, PROBLEM_STATUSES } from "@/lib/constants";
import { ProblemForm } from "@/components/problems/problem-form";
import type { Pattern, ProblemStatus, ProblemWithMeta, Tag } from "@/types";

/**
 * Header actions for a problem: open the original, edit it, delete it.
 * Delete asks for the exact title before it will call `deleteProblem`.
 */
export function ProblemHeaderActions({
  problem,
  patterns,
  tags,
}: {
  problem: ProblemWithMeta;
  patterns: Pattern[];
  tags: Tag[];
}) {
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {problem.external_url ? (
          <a href={problem.external_url} target="_blank" rel="noreferrer noopener">
            <Button variant="outline" size="sm">
              Open Problem <span aria-hidden>↗</span>
            </Button>
          </a>
        ) : null}
        <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
          Edit
        </Button>
        <Button variant="danger" size="sm" onClick={() => setConfirming(true)}>
          Delete
        </Button>
      </div>

      <Modal
        open={editing}
        onClose={() => setEditing(false)}
        title={`Edit · ${problem.title}`}
        className="max-h-[85vh] max-w-2xl overflow-y-auto"
      >
        <ProblemForm
          mode="edit"
          problem={problem}
          patterns={patterns}
          tags={tags}
          onSuccess={() => setEditing(false)}
        />
      </Modal>

      <DeleteProblemDialog
        problem={problem}
        open={confirming}
        onClose={() => setConfirming(false)}
      />
    </>
  );
}

/** Typed confirmation: the submit button unlocks once the title matches. */
function DeleteProblemDialog({
  problem,
  open,
  onClose,
}: {
  problem: ProblemWithMeta;
  open: boolean;
  onClose: () => void;
}) {
  const [confirmation, setConfirmation] = useState("");
  const [pending, startTransition] = useTransition();
  const matches = confirmation === problem.title;

  return (
    <Modal open={open} onClose={onClose} title="Delete problem">
      <form
        className="flex flex-col gap-4"
        action={() => {
          if (!matches) return;
          startTransition(() => {
            void deleteProblem(problem.id);
          });
        }}
      >
        <p className="text-sm leading-relaxed text-muted">
          This deletes <span className="text-ink">{problem.title}</span> and
          everything attached to it — thinking sessions, AI links, resources,
          visualizations, notes, solutions, and reviews. It cannot be undone.
        </p>
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="delete-confirm"
            className="text-xs font-medium text-muted"
          >
            Type <span className="text-ink">{problem.title}</span> to confirm
          </label>
          <Input
            id="delete-confirm"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            placeholder={problem.title}
            autoComplete="off"
          />
        </div>
        <div className="flex items-center justify-end gap-2">
          {pending ? <Spinner label="Deleting…" /> : null}
          <Button variant="ghost" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="danger"
            disabled={!matches || pending}
            aria-label="Confirm delete"
          >
            Delete permanently
          </Button>
        </div>
      </form>
    </Modal>
  );
}

/** Inline status quick-switch — saves without opening the edit form. */
export function ProblemStatusControl({
  problemId,
  status,
}: {
  problemId: string;
  status: ProblemStatus;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor="problem-status" className="text-xs font-medium text-muted">
        Status
      </label>
      <div className="flex items-center gap-2">
        <Select
          id="problem-status"
          value={status}
          disabled={pending}
          className="h-9 w-44"
          onChange={(event) => {
            const next = event.target.value;
            setError(null);
            startTransition(async () => {
              const result = await setProblemStatus(problemId, next as ProblemStatus);
              if (!result.ok) setError(result.error ?? "Could not update status.");
            });
          }}
        >
          {PROBLEM_STATUSES.map((option) => (
            <option key={option} value={option}>
              {STATUS_LABELS[option]}
            </option>
          ))}
        </Select>
        {pending ? <Spinner label="Saving status…" /> : null}
      </div>
      {error ? (
        <p role="alert" className="text-xs text-rose-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}
