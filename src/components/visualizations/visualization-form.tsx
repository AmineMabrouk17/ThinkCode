"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import {
  createVisualization,
  updateVisualizationAction,
} from "@/app/problems/visualization-actions";
import {
  DEFAULT_VISUALIZATION_TYPE,
  MAX_VISUALIZATION_CONTENT_LENGTH,
  MAX_VISUALIZATION_TITLE_LENGTH,
  MAX_VISUALIZATION_URL_LENGTH,
  VISUALIZATION_LABELS,
  VISUALIZATION_PLACEHOLDERS,
  VISUALIZATION_TYPES,
  VISUALIZATION_TYPE_EMOJI,
  isVisualizationType,
} from "@/lib/constants";
import { isExternalUrl } from "@/lib/resource-utils";
import { templatesForType } from "@/lib/visualization-templates";
import { MermaidEditor } from "@/components/visualizations/mermaid-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import type { Visualization, VisualizationFormState, VisualizationType } from "@/types";

const INITIAL_STATE: VisualizationFormState = { status: "idle" };

/** One line per type, so the field explains itself before you type in it. */
const TYPE_HINTS: Record<VisualizationType, string> = {
  mermaid:
    "Mermaid source, rendered live. Best for flowcharts, state machines, and anything with decisions.",
  diagram:
    "Plain text, kept exactly as you type it. Best for a two-pointer walk, a stack trace, or a hand-drawn table.",
  image:
    "A link to a picture that already exists — a screenshot, or a sketch you made elsewhere. ThinkCode has no upload, so only the URL is stored.",
};

export type VisualizationFormProps = {
  problemId: string;
  mode: "create" | "edit";
  /** Existing visualization when `mode === "edit"`. */
  visualization?: Visualization;
  onSuccess?: (visualizationId: string) => void;
};

/**
 * Create/edit form for one visualization: a type, a title, and content whose
 * affordance follows the type.
 *
 * A Mermaid row gets the write/preview editor (so syntax errors are visible
 * before saving), a text diagram gets a plain monospace box that never touches
 * the content, and an image gets a URL field with the no-upload rule said out
 * loud. The starter snippets sit in a collapsed disclosure for the same
 * reason: useful, but never in the way.
 */
export function VisualizationForm({
  problemId,
  mode,
  visualization,
  onSuccess,
}: VisualizationFormProps) {
  const router = useRouter();
  const fieldId = useId();
  const action = mode === "create" ? createVisualization : updateVisualizationAction;
  const [state, formAction, pending] = useActionState(action, INITIAL_STATE);

  const [type, setType] = useState<VisualizationType>(
    visualization?.type ?? DEFAULT_VISUALIZATION_TYPE
  );
  const [content, setContent] = useState(visualization?.content ?? "");

  // Keep the latest callback in a ref so the submit effect does not have to
  // depend on a prop that changes identity on every render.
  const onSuccessRef = useRef(onSuccess);
  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  // Close the surrounding modal once the save lands; the revalidated props
  // then render the saved card.
  useEffect(() => {
    if (state.status !== "success" || !state.visualizationId) return;
    router.refresh();
    onSuccessRef.current?.(state.visualizationId);
  }, [router, state]);

  const fieldErrors = state.fieldErrors ?? {};
  const templates = templatesForType(type);
  const isImage = type === "image";

  /** Insert a starter snippet, replacing whatever is in the box. */
  function insertTemplate(code: string) {
    setContent(code);
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="problemId" value={problemId} />
      {mode === "edit" && visualization ? (
        <input type="hidden" name="visualizationId" value={visualization.id} />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-[minmax(0,14rem)_minmax(0,1fr)]">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor={`${fieldId}-type`}
            className="text-xs font-medium text-muted"
          >
            Type
          </label>
          <Select
            id={`${fieldId}-type`}
            name="type"
            value={type}
            onChange={(event) => {
              const next = event.target.value;
              if (isVisualizationType(next)) setType(next);
            }}
            aria-invalid={fieldErrors.type ? true : undefined}
          >
            {VISUALIZATION_TYPES.map((value) => (
              <option key={value} value={value}>
                {VISUALIZATION_TYPE_EMOJI[value]} {VISUALIZATION_LABELS[value]}
              </option>
            ))}
          </Select>
          {fieldErrors.type ? (
            <p role="alert" className="text-xs text-rose-400">
              {fieldErrors.type}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor={`${fieldId}-title`}
            className="text-xs font-medium text-muted"
          >
            Title <span className="text-accent">*</span>
          </label>
          <Input
            id={`${fieldId}-title`}
            name="title"
            defaultValue={visualization?.title ?? ""}
            maxLength={MAX_VISUALIZATION_TITLE_LENGTH}
            placeholder="Complement lookup"
            aria-invalid={fieldErrors.title ? true : undefined}
          />
          {fieldErrors.title ? (
            <p role="alert" className="text-xs text-rose-400">
              {fieldErrors.title}
            </p>
          ) : null}
        </div>
      </div>

      <p className="rounded-lg border border-border bg-surface-2/40 px-3 py-2 text-xs leading-relaxed text-muted">
        {TYPE_HINTS[type]}
      </p>

      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted">
          {isImage ? "Image link" : "Diagram"} <span className="text-accent">*</span>
        </span>

        {type === "mermaid" ? (
          <MermaidEditor
            id={`${fieldId}-content`}
            value={content}
            onChange={setContent}
            error={fieldErrors.content}
            placeholder={VISUALIZATION_PLACEHOLDERS.mermaid}
          />
        ) : null}

        {type === "diagram" ? (
          <Textarea
            id={`${fieldId}-content`}
            name="content"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            maxLength={MAX_VISUALIZATION_CONTENT_LENGTH}
            rows={9}
            spellCheck={false}
            placeholder={VISUALIZATION_PLACEHOLDERS.diagram}
            aria-label="Diagram text"
            aria-invalid={fieldErrors.content ? true : undefined}
            className="resize-y font-mono text-xs leading-relaxed"
          />
        ) : null}

        {isImage ? (
          <>
            <Input
              id={`${fieldId}-content`}
              name="content"
              type="url"
              inputMode="url"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              maxLength={MAX_VISUALIZATION_URL_LENGTH}
              placeholder={VISUALIZATION_PLACEHOLDERS.image}
              aria-invalid={fieldErrors.content ? true : undefined}
            />
            {fieldErrors.content ? (
              <p role="alert" className="text-xs text-rose-400">
                {fieldErrors.content}
              </p>
            ) : !fieldErrors.content && content && !isExternalUrl(content) ? (
              <p className="text-xs text-muted/80">
                Only absolute http:// or https:// links are kept — everything
                else is refused before it reaches the database.
              </p>
            ) : null}
          </>
        ) : null}
      </div>

      <details className="rounded-lg border border-border bg-surface-2/30 px-3 py-2">
        <summary className="cursor-pointer text-xs font-medium text-muted">
          Starter snippets — insert, then edit into yours
        </summary>
        <ul className="mt-3 flex flex-col gap-2">
          {templates.map((template) => (
            <li
              key={template.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-surface px-3 py-2"
            >
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="text-xs font-medium text-ink">{template.label}</span>
                <span className="text-xs text-muted/80">{template.hint}</span>
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => insertTemplate(template.code)}
                aria-label={`Insert the ${template.label} snippet`}
              >
                Insert
              </Button>
            </li>
          ))}
        </ul>
      </details>

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
          {mode === "create" ? "＋ Save visualization" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
