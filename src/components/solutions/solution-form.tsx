"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { createSolution, updateSolutionAction } from "@/app/problems/solution-actions";
import {
  DEFAULT_SOLUTION_LANGUAGE,
  LANGUAGES,
  LANGUAGE_LABELS,
  MAX_SOLUTION_ALTERNATIVES,
} from "@/lib/constants";
import { MarkdownEditor } from "@/components/knowledge/markdown-editor";
import { CodeEditor } from "@/components/solutions/code-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { parseAlternatives } from "@/lib/solution-utils";
import type { Solution, SolutionAlternative, SolutionFormState } from "@/types";

const INITIAL_STATE: SolutionFormState = { status: "idle" };

type AlternativeRow = SolutionAlternative & { key: string };

let rowCounter = 0;
function nextKey() {
  rowCounter += 1;
  return `alt-${rowCounter}`;
}

function toRows(alternatives: SolutionAlternative[]): AlternativeRow[] {
  return alternatives.map((alternative) => ({ ...alternative, key: nextKey() }));
}

export type SolutionFormProps = {
  problemId: string;
  mode: "create" | "edit";
  /** Existing solution when `mode === "edit"`. */
  solution?: Solution;
  onSuccess?: (solutionId: string) => void;
};

/**
 * Create/edit form for one final solution: a language select, the code editor,
 * time/space complexity, an optional markdown explanation, and optional
 * alternative solutions. Stored in its own table, entirely separate from the
 * thinking sessions above it on the problem page.
 */
export function SolutionForm({ problemId, mode, solution, onSuccess }: SolutionFormProps) {
  const router = useRouter();
  const fieldId = useId();
  const action = mode === "create" ? createSolution : updateSolutionAction;
  const [state, formAction, pending] = useActionState(action, INITIAL_STATE);

  const [language, setLanguage] = useState(solution?.language ?? DEFAULT_SOLUTION_LANGUAGE);
  const [code, setCode] = useState(solution?.code ?? "");
  const [explanation, setExplanation] = useState(solution?.explanation ?? "");
  const [alternatives, setAlternatives] = useState<AlternativeRow[]>(() =>
    toRows(parseAlternatives(solution?.alternatives))
  );

  const onSuccessRef = useRef(onSuccess);
  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  useEffect(() => {
    if (state.status !== "success" || !state.solutionId) return;
    router.refresh();
    onSuccessRef.current?.(state.solutionId);
  }, [router, state]);

  const fieldErrors = state.fieldErrors ?? {};

  function addRow() {
    setAlternatives((rows) =>
      rows.length >= MAX_SOLUTION_ALTERNATIVES
        ? rows
        : [...rows, { key: nextKey(), label: "", code: "" }]
    );
  }

  function removeRow(key: string) {
    setAlternatives((rows) => rows.filter((row) => row.key !== key));
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="problemId" value={problemId} />
      {mode === "edit" && solution ? (
        <input type="hidden" name="solutionId" value={solution.id} />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor={`${fieldId}-language`}
            className="text-xs font-medium text-muted"
          >
            Language
          </label>
          <Select
            id={`${fieldId}-language`}
            name="language"
            value={language}
            onChange={(event) => setLanguage(event.target.value)}
            aria-invalid={fieldErrors.language ? true : undefined}
          >
            {LANGUAGES.map((value) => (
              <option key={value} value={value}>
                {LANGUAGE_LABELS[value]}
              </option>
            ))}
          </Select>
          {fieldErrors.language ? (
            <p role="alert" className="text-xs text-rose-400">
              {fieldErrors.language}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor={`${fieldId}-time`}
            className="text-xs font-medium text-muted"
          >
            Time complexity
          </label>
          <Input
            id={`${fieldId}-time`}
            name="timeComplexity"
            defaultValue={solution?.time_complexity ?? ""}
            placeholder="O(n)"
            aria-invalid={fieldErrors.timeComplexity ? true : undefined}
          />
          {fieldErrors.timeComplexity ? (
            <p role="alert" className="text-xs text-rose-400">
              {fieldErrors.timeComplexity}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor={`${fieldId}-space`}
            className="text-xs font-medium text-muted"
          >
            Space complexity
          </label>
          <Input
            id={`${fieldId}-space`}
            name="spaceComplexity"
            defaultValue={solution?.space_complexity ?? ""}
            placeholder="O(n)"
            aria-invalid={fieldErrors.spaceComplexity ? true : undefined}
          />
          {fieldErrors.spaceComplexity ? (
            <p role="alert" className="text-xs text-rose-400">
              {fieldErrors.spaceComplexity}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted">
          Code <span className="text-accent">*</span>
        </span>
        <CodeEditor
          value={code}
          onChange={setCode}
          language={language}
          label="Solution code"
          placeholder="def twoSum(nums, target):"
        />
        {fieldErrors.code ? (
          <p role="alert" className="text-xs text-rose-400">
            {fieldErrors.code}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted">Explanation</span>
        <MarkdownEditor
          id={`${fieldId}-explanation`}
          name="explanation"
          value={explanation}
          onChange={setExplanation}
          error={fieldErrors.explanation}
          placeholder="Why it works: …"
          minHeightClass="min-h-48"
        />
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-xs font-medium text-muted">
          Alternative solutions (optional)
        </legend>

        {alternatives.map((row, index) => (
          <div
            key={row.key}
            className="flex flex-col gap-2 rounded-lg border border-border bg-surface-2/40 p-3"
          >
            <div className="flex flex-wrap items-end gap-2">
              <div className="flex min-w-40 flex-1 flex-col gap-1.5">
                <label
                  htmlFor={`${fieldId}-alt-label-${row.key}`}
                  className="text-xs text-muted"
                >
                  Label
                </label>
                <Input
                  id={`${fieldId}-alt-label-${row.key}`}
                  name="alternativeLabel"
                  defaultValue={row.label}
                  placeholder={index === 0 ? "Brute force — O(n²)" : "Label"}
                />
              </div>
              <div className="flex w-40 flex-col gap-1.5">
                <label
                  htmlFor={`${fieldId}-alt-lang-${row.key}`}
                  className="text-xs text-muted"
                >
                  Language
                </label>
                <Select
                  id={`${fieldId}-alt-lang-${row.key}`}
                  name="alternativeLanguage"
                  defaultValue={row.language ?? language}
                >
                  {LANGUAGES.map((value) => (
                    <option key={value} value={value}>
                      {LANGUAGE_LABELS[value]}
                    </option>
                  ))}
                </Select>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeRow(row.key)}
                aria-label={`Remove alternative ${index + 1}`}
                className="px-2 text-muted hover:text-rose-400"
              >
                <span aria-hidden>🗑</span>
              </Button>
            </div>
            <Textarea
              name="alternativeCode"
              defaultValue={row.code}
              rows={5}
              placeholder="Paste the alternative code"
              className="font-mono text-sm"
            />
          </div>
        ))}

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addRow}
            disabled={alternatives.length >= MAX_SOLUTION_ALTERNATIVES}
          >
            ＋ Add alternative
          </Button>
          {fieldErrors.alternatives ? (
            <p role="alert" className="text-xs text-rose-400">
              {fieldErrors.alternatives}
            </p>
          ) : null}
        </div>
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
          {mode === "create" ? "＋ Save solution" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
