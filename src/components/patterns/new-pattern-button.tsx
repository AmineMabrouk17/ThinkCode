"use client";

import { useState } from "react";

import { Button, type ButtonProps } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { PatternForm } from "@/components/patterns/pattern-form";
import type { Pattern } from "@/types";

/**
 * "＋ New pattern" — opens the create form in a modal. Used in the library
 * header and in the empty state of an empty library.
 */
export function NewPatternButton({
  categories,
  patterns,
  label = "＋ New pattern",
  variant = "primary",
  size = "md",
}: {
  categories: string[];
  patterns?: Pattern[];
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
        title="New pattern"
        className="max-h-[85vh] max-w-2xl overflow-y-auto"
      >
        <PatternForm
          categories={categories}
          patterns={patterns}
          onSuccess={() => setOpen(false)}
        />
      </Modal>
    </>
  );
}
