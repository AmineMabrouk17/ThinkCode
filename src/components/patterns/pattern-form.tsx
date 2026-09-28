"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import {
  CATEGORY_OPTIONS,
  CUSTOM_OPTION,
  DEFAULT_CATEGORY,
  MAX_DESCRIPTION_LENGTH,
  MAX_MENTAL_MODEL_LENGTH,
  MAX_SIGNAL_LENGTH,
  MAX_SIGNALS,
  MAX_TITLE_LENGTH,
} from "@/lib/constants";
import { createPattern } from "@/app/patterns/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import type { Pattern, PatternFormState } from "@/types";

const INITIAL_STATE: PatternFormState = { status: "idle" };

function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-xs font-medium text-muted">
        {label}
        {required ? <span className="ml-0.5 text-accent">*</span> : null}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} role="alert" className="text-xs text-rose-400">
          {error}
        </p>
      ) : hint ? (
        <p id={`${htmlFor}-hint`} className="text-xs text-muted/80">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export type PatternFormProps = {
  /** Categories already in use, so an existing one is one click away. */
  categories: string[];
  /** Full pattern catalogue, only used for the duplicate-name hint. */
  patterns?: Pattern[];
  /** Called after a successful submit (used to close the surrounding modal). */
  onSuccess?: (slug: string) => void;
};

/**
 * Create form for a pattern, shown in a modal from the pattern library.
 * Mirrors {@link ProblemForm}: `useActionState` over the `createPattern`
 * server action, with pending and field-level errors from the returned state.
 */
export function PatternForm({ categories, patterns = [], onSuccess }: PatternFormProps) {
  const router = useRouter();
  const fieldId = useId();
  const [state, formAction, pending] = useActionState(createPattern, INITIAL_STATE);

  // Curated NeetCode categories plus whatever this library already uses.
  const categoryOptions = [...new Set([...CATEGORY_OPTIONS, ...categories])].sort(
    (a, b) => a.localeCompare(b)
  );

  const [categoryChoice, setCategoryChoice] = useState(DEFAULT_CATEGORY);
  const [categoryCustom, setCategoryCustom] = useState("");

  // Keep the latest callback in a ref so the submit effect does not depend on
  // a prop that changes identity on every render.
  const onSuccessRef = useRef(onSuccess);
  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  useEffect(() => {
    if (state.status !== "success" || !state.slug) return;
    onSuccessRef.current?.(state.slug);
    router.push(`/patterns/${state.slug}`);
    router.refresh();
  }, [router, state]);

  const category =
    categoryChoice === CUSTOM_OPTION
      ? categoryCustom.trim() || DEFAULT_CATEGORY
      : categoryChoice;

  const fieldErrors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="category" value={category} />

      <Field
        label="Name"
        htmlFor={`${fieldId}-name`}
        required
        error={fieldErrors.name}
        hint={
          patterns.length
            ? `e.g. ${patterns[0].name} — the URL slug comes from this name.`
            : "The URL slug comes from this name."
        }
      >
        <Input
          id={`${fieldId}-name`}
          name="name"
          defaultValue=""
          maxLength={MAX_TITLE_LENGTH}
          placeholder="Fast & Slow"
          required
          autoFocus
          aria-invalid={fieldErrors.name ? true : undefined}
          aria-describedby={fieldErrors.name ? `${fieldId}-name-error` : undefined}
        />
      </Field>

      <Field label="Category" htmlFor={`${fieldId}-category`} error={fieldErrors.category}>
        <div className="flex flex-col gap-2">
          <Select
            id={`${fieldId}-category`}
            value={categoryChoice}
            onChange={(event) => setCategoryChoice(event.target.value)}
          >
            {categoryOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
            <option value={CUSTOM_OPTION}>Other (type it)…</option>
          </Select>
          {categoryChoice === CUSTOM_OPTION ? (
            <Input
              value={categoryCustom}
              onChange={(event) => setCategoryCustom(event.target.value)}
              placeholder="e.g. Dynamic Programming"
              aria-label="Custom category"
            />
          ) : null}
        </div>
      </Field>

      <Field
        label="Description"
        htmlFor={`${fieldId}-description`}
        hint="One or two lines: what the pattern does, in your own words."
        error={fieldErrors.description}
      >
        <Textarea
          id={`${fieldId}-description`}
          name="description"
          rows={3}
          maxLength={MAX_DESCRIPTION_LENGTH}
          placeholder="Use two indices to scan a list from opposite ends."
        />
      </Field>

      <Field
        label="Mental model"
        htmlFor={`${fieldId}-mental-model`}
        hint="The sentence you want to remember when you spot the pattern."
        error={fieldErrors.mentalModel}
      >
        <Textarea
          id={`${fieldId}-mental-model`}
          name="mentalModel"
          rows={3}
          maxLength={MAX_MENTAL_MODEL_LENGTH}
          placeholder="Shrink the search space one pointer at a time."
        />
      </Field>

      <Field
        label="Common signals"
        htmlFor={`${fieldId}-signals`}
        hint="One signal per line — the hints that mean “this pattern”."
        error={fieldErrors.commonSignals}
      >
        <Textarea
          id={`${fieldId}-signals`}
          name="commonSignals"
          rows={4}
          maxLength={MAX_SIGNALS * MAX_SIGNAL_LENGTH}
          placeholder={"Array is sorted\nPair or triplet summing\nBoundary conditions"}
        />
      </Field>

      {state.status === "error" && state.message ? (
        <p
          role="alert"
          className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300"
        >
          {state.message}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border pt-4">
        {pending ? <Spinner label="Saving…" /> : null}
        <Button type="submit" disabled={pending}>
          ＋ Create pattern
        </Button>
      </div>
    </form>
  );
}
