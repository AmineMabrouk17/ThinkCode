"use client";

import { useState } from "react";

import { Button, type ButtonProps } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { ProblemForm } from "@/components/problems/problem-form";
import type { Pattern, Tag } from "@/types";

/**
 * "＋ New problem" — opens the create form in a modal. Used in the library
 * toolbar and in the empty state of an empty library.
 */
export function NewProblemButton({
  patterns,
  tags,
  label = "＋ New problem",
  variant = "primary",
  size = "md",
}: {
  patterns: Pattern[];
  tags: Tag[];
  label?: string;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant={variant} size={size} onClick={() => setOpen(true)}>
        {label}
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="New problem"
        className="max-h-[85vh] max-w-2xl overflow-y-auto"
      >
        <ProblemForm
          mode="create"
          patterns={patterns}
          tags={tags}
          onSuccess={() => setOpen(false)}
        />
      </Modal>
    </>
  );
}
