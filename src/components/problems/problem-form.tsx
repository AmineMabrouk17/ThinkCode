"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import {
  CATEGORY_OPTIONS,
  CUSTOM_OPTION,
  DEFAULT_CATEGORY,
  DEFAULT_DIFFICULTY,
  DEFAULT_PLATFORM,
  DEFAULT_STATUS,
  DIFFICULTIES,
  DIFFICULTY_LABELS,
  MAX_DESCRIPTION_LENGTH,
  MAX_TAG_LENGTH,
  MAX_TAGS,
  MAX_TITLE_LENGTH,
  PLATFORM_OPTIONS,
  PROBLEM_STATUSES,
  STATUS_LABELS,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import { createProblem, updateProblem } from "@/app/problems/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import type { Pattern, ProblemFormState, ProblemWithMeta, Tag } from "@/types";

const INITIAL_STATE: ProblemFormState = { status: "idle" };

/** Platforms/categories offer a curated list plus a free-text escape hatch. */
function toChoice(value: string, options: readonly string[]): string {
  return (options as readonly string[]).includes(value) ? value : CUSTOM_OPTION;
}

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

function Pill({
  active,
  children,
  ...props
}: React.ComponentPropsWithoutRef<"button"> & { active?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "border-accent/40 bg-accent/15 text-indigo-200"
          : "border-border bg-surface-2 text-muted hover:text-ink"
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export type ProblemFormProps = {
  mode: "create" | "edit";
  /** Existing problem when `mode === "edit"`. */
  problem?: ProblemWithMeta;
  /** Full pattern catalogue, for the pattern pills. */
  patterns: Pattern[];
  /** Existing tag names, for the tag pills. */
  tags: Tag[];
  /** Called after a successful submit (used to close the surrounding modal). */
  onSuccess?: (problemId: string) => void;
};

/**
 * Create/edit form shared by the library page and the problem detail page.
 * Submits to the `createProblem` / `updateProblem` server actions and shows
 * pending + field-level errors from the returned {@link ProblemFormState}.
 */
export function ProblemForm({
  mode,
  problem,
  patterns,
  tags,
  onSuccess,
}: ProblemFormProps) {
  const router = useRouter();
  const fieldId = useId();
  const action = mode === "create" ? createProblem : updateProblem;
  const [state, formAction, pending] = useActionState(action, INITIAL_STATE);

  const initialPlatform = problem?.platform ?? DEFAULT_PLATFORM;
  const initialCategory = problem?.category ?? DEFAULT_CATEGORY;

  const [platformChoice, setPlatformChoice] = useState(() =>
    toChoice(initialPlatform, PLATFORM_OPTIONS)
  );
  const [platformCustom, setPlatformCustom] = useState(() =>
    toChoice(initialPlatform, PLATFORM_OPTIONS) === CUSTOM_OPTION
      ? initialPlatform
      : ""
  );

  const [categoryChoice, setCategoryChoice] = useState(() =>
    toChoice(initialCategory, CATEGORY_OPTIONS)
  );
  const [categoryCustom, setCategoryCustom] = useState(() =>
    toChoice(initialCategory, CATEGORY_OPTIONS) === CUSTOM_OPTION
      ? initialCategory
      : ""
  );

  const [patternIds, setPatternIds] = useState<string[]>(
    () => problem?.patterns.map((pattern) => pattern.id) ?? []
  );
  const [selectedTags, setSelectedTags] = useState<string[]>(
    () => problem?.tags.map((tag) => tag.name) ?? []
  );
  const [tagDraft, setTagDraft] = useState("");

  // Keep the latest callback in a ref so the submit effect does not have to
  // depend on a prop that changes identity on every render.
  const onSuccessRef = useRef(onSuccess);
  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  useEffect(() => {
    if (state.status !== "success" || !state.problemId) return;
    if (mode === "create") router.push(`/problems/${state.problemId}`);
    router.refresh();
    onSuccessRef.current?.(state.problemId);
  }, [mode, router, state]);

  const platform =
    platformChoice === CUSTOM_OPTION
      ? platformCustom.trim() || DEFAULT_PLATFORM
      : platformChoice;
  const category =
    categoryChoice === CUSTOM_OPTION
      ? categoryCustom.trim() || DEFAULT_CATEGORY
      : categoryChoice;

  const fieldErrors = state.fieldErrors ?? {};

  const togglePattern = (patternId: string) =>
    setPatternIds((current) =>
      current.includes(patternId)
        ? current.filter((id) => id !== patternId)
        : [...current, patternId]
    );

  const toggleTag = (name: string) =>
    setSelectedTags((current) =>
      current.includes(name)
        ? current.filter((tag) => tag !== name)
        : [...current, name]
    );

  const addTagDraft = () => {
    const name = tagDraft.trim().slice(0, MAX_TAG_LENGTH);
    if (!name) return;
    setSelectedTags((current) =>
      current.some((tag) => tag.toLowerCase() === name.toLowerCase())
        ? current
        : [...current, name].slice(0, MAX_TAGS)
    );
    setTagDraft("");
  };

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {mode === "edit" && problem ? (
        <input type="hidden" name="problemId" value={problem.id} />
      ) : null}

      <input type="hidden" name="platform" value={platform} />
      <input type="hidden" name="category" value={category} />
      {patternIds.map((patternId) => (
        <input key={patternId} type="hidden" name="patternIds" value={patternId} />
      ))}
      {selectedTags.map((tag) => (
        <input key={tag} type="hidden" name="tags" value={tag} />
      ))}

      <Field
        label="Title"
        htmlFor={`${fieldId}-title`}
        required
        error={fieldErrors.title}
      >
        <Input
          id={`${fieldId}-title`}
          name="title"
          defaultValue={problem?.title ?? ""}
          maxLength={MAX_TITLE_LENGTH}
          placeholder="Two Sum"
          required
          aria-invalid={fieldErrors.title ? true : undefined}
          aria-describedby={fieldErrors.title ? `${fieldId}-title-error` : undefined}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Platform" htmlFor={`${fieldId}-platform`}>
          <div className="flex flex-col gap-2">
            <Select
              id={`${fieldId}-platform`}
              value={platformChoice}
              onChange={(event) => setPlatformChoice(event.target.value)}
            >
              {PLATFORM_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
              <option value={CUSTOM_OPTION}>Other (type it)…</option>
            </Select>
            {platformChoice === CUSTOM_OPTION ? (
              <Input
                value={platformCustom}
                onChange={(event) => setPlatformCustom(event.target.value)}
                placeholder="e.g. Codeforces"
                aria-label="Custom platform"
              />
            ) : null}
          </div>
        </Field>

        <Field
          label="External URL"
          htmlFor={`${fieldId}-url`}
          hint="NeetCode, LeetCode, or your own write-up."
          error={fieldErrors.externalUrl}
        >
          <Input
            id={`${fieldId}-url`}
            name="externalUrl"
            type="url"
            inputMode="url"
            defaultValue={problem?.external_url ?? ""}
            placeholder="https://neetcode.io/problems/two-integer-sum"
            aria-invalid={fieldErrors.externalUrl ? true : undefined}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Difficulty"
          htmlFor={`${fieldId}-difficulty`}
          required
          error={fieldErrors.difficulty}
        >
          <Select
            id={`${fieldId}-difficulty`}
            name="difficulty"
            defaultValue={problem?.difficulty ?? DEFAULT_DIFFICULTY}
          >
            {DIFFICULTIES.map((difficulty) => (
              <option key={difficulty} value={difficulty}>
                {DIFFICULTY_LABELS[difficulty]}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Status" htmlFor={`${fieldId}-status`} error={fieldErrors.status}>
          <Select
            id={`${fieldId}-status`}
            name="status"
            defaultValue={problem?.status ?? DEFAULT_STATUS}
          >
            {PROBLEM_STATUSES.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label="Category" htmlFor={`${fieldId}-category`} error={fieldErrors.category}>
        <div className="flex flex-col gap-2">
          <Select
            id={`${fieldId}-category`}
            value={categoryChoice}
            onChange={(event) => setCategoryChoice(event.target.value)}
          >
            {CATEGORY_OPTIONS.map((option) => (
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
        hint="The problem in your own words — what makes it interesting?"
        error={fieldErrors.description}
      >
        <Textarea
          id={`${fieldId}-description`}
          name="description"
          rows={4}
          maxLength={MAX_DESCRIPTION_LENGTH}
          defaultValue={problem?.description ?? ""}
          placeholder="Given nums and target, return the indices of the two numbers that add up to target."
        />
      </Field>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-xs font-medium text-muted">
          Patterns
          {patternIds.length ? (
            <span className="ml-1.5 font-mono text-muted/70">
              {patternIds.length} selected
            </span>
          ) : null}
        </legend>
        {patterns.length ? (
          <div className="flex flex-wrap gap-2">
            {patterns.map((pattern) => (
              <Pill
                key={pattern.id}
                active={patternIds.includes(pattern.id)}
                onClick={() => togglePattern(pattern.id)}
                aria-label={`${pattern.name} pattern`}
              >
                {pattern.name}
              </Pill>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted">
            No patterns catalogued yet — the pattern library fills this in.
          </p>
        )}
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-xs font-medium text-muted">
          Tags
          <span className="ml-1.5 font-mono text-muted/70">
            {selectedTags.length}/{MAX_TAGS}
          </span>
        </legend>
        {tags.length ? (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Pill
                key={tag.id}
                active={selectedTags.includes(tag.name)}
                onClick={() => toggleTag(tag.name)}
                aria-label={`${tag.name} tag`}
              >
                #{tag.name}
              </Pill>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted">
            No tags yet — create your first one below.
          </p>
        )}

        <div className="flex gap-2">
          <Input
            value={tagDraft}
            onChange={(event) => setTagDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addTagDraft();
              }
            }}
            placeholder="New tag, e.g. needs-review"
            maxLength={MAX_TAG_LENGTH}
            aria-label="New tag name"
          />
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={addTagDraft}
            disabled={!tagDraft.trim()}
          >
            Add tag
          </Button>
        </div>

        {selectedTags.length ? (
          <ul className="flex flex-wrap gap-2" aria-label="Selected tags">
            {selectedTags.map((tag) => (
              <li key={tag}>
                <Badge variant="accent" className="gap-1.5">
                  #{tag}
                  <button
                    type="button"
                    onClick={() => toggleTag(tag)}
                    aria-label={`Remove tag ${tag}`}
                    className="rounded-full px-1 text-indigo-300 hover:text-ink"
                  >
                    <span aria-hidden>×</span>
                  </button>
                </Badge>
              </li>
            ))}
          </ul>
        ) : null}
        {fieldErrors.tags ? (
          <p role="alert" className="text-xs text-rose-400">
            {fieldErrors.tags}
          </p>
        ) : null}
      </fieldset>

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
          {mode === "create" ? "＋ Create problem" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
