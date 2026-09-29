"use server";

import { revalidatePath } from "next/cache";

import {
  MAX_VISUALIZATION_CONTENT_LENGTH,
  MAX_VISUALIZATION_TITLE_LENGTH,
  MAX_VISUALIZATION_URL_LENGTH,
  isVisualizationType,
} from "@/lib/constants";
import {
  deleteVisualization,
  getProblem,
  insertVisualization,
  updateVisualization,
} from "@/lib/db";
import { normalizeExternalUrl } from "@/lib/resource-utils";
import type {
  VisualizationField,
  VisualizationFormState,
  VisualizationInput,
  VisualizationType,
} from "@/types";

/**
 * UNDERSTAND mutations: the picture a problem finally makes obvious.
 *
 * Same shape as the problem/note/solution/resource actions: every export of a
 * `"use server"` file must be async, so the form-facing actions take the
 * `useActionState` shape `(prevState, formData)` and return a serializable
 * state object. The `problemId` travels in a hidden field and is re-validated
 * against D1 before anything is written; edits and deletes carry both ids so a
 * hand-crafted call cannot touch another problem's rows.
 *
 * The product rule this file protects, in two parts:
 *  1. a visualization belongs to the problem — the type decides what `content`
 *     means, and nothing else is accepted, and
 *  2. an `image` is a *link* to a drawing that lives somewhere else. There is
 *     no upload, so the only thing that can be stored is an absolute `http(s)`
 *     URL, normalized through {@link normalizeExternalUrl} — `javascript:` and
 *     friends never reach D1.
 */

/** Only the problem page renders visualization data. */
function revalidateVisualizationPaths(problemId: string) {
  revalidatePath(`/problems/${problemId}`);
}

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

/** Trim, enforce a cap, and report whether the cap actually bit. */
function capped(
  value: string,
  max: number
): { value: string; tooLong: boolean } {
  if (value.length > max) return { value: value.slice(0, max), tooLong: true };
  return { value, tooLong: false };
}

function visualizationErrorState(
  message: string,
  fieldErrors: Partial<Record<VisualizationField, string>> = {}
): VisualizationFormState {
  return { status: "error", message, fieldErrors };
}

/** Per-type copy for the "content is missing" message — it teaches the shape. */
function contentHint(type: VisualizationType): string {
  if (type === "image") {
    return "Paste the image link — it must start with http:// or https://.";
  }
  if (type === "diagram") {
    return "Draw the walk: the numbers, the pointers, what changes each step.";
  }
  return "Write the diagram source — start from a starter snippet above.";
}

/** Validate raw `FormData` into a {@link VisualizationInput}. */
function parseVisualizationInput(formData: FormData): {
  input: VisualizationInput | null;
  fieldErrors: Partial<Record<VisualizationField, string>>;
} {
  const fieldErrors: Partial<Record<VisualizationField, string>> = {};

  const problemId = text(formData, "problemId");
  if (!problemId) {
    return {
      input: null,
      fieldErrors: {
        content: "Missing problem id — reopen the problem and try again.",
      },
    };
  }

  const rawType = text(formData, "type");
  const type: VisualizationType = isVisualizationType(rawType) ? rawType : "mermaid";
  if (!isVisualizationType(rawType)) {
    fieldErrors.type = "Pick a Mermaid diagram, a text diagram, or an image link.";
  }

  const title = capped(text(formData, "title"), MAX_VISUALIZATION_TITLE_LENGTH);
  if (!title.value) {
    fieldErrors.title = "Name the visualization so you recognise it later.";
  } else if (title.tooLong) {
    fieldErrors.title = `Keep the title under ${MAX_VISUALIZATION_TITLE_LENGTH} characters.`;
  }

  // A diagram body is trusted text (it is rendered inside a <pre>), an image is
  // a URL and goes through the same gate as every other link in the app.
  const rawContent = text(formData, "content");
  const cap = type === "image" ? MAX_VISUALIZATION_URL_LENGTH : MAX_VISUALIZATION_CONTENT_LENGTH;
  const content = capped(rawContent, cap);

  if (!content.value) {
    fieldErrors.content = contentHint(type);
  } else if (content.tooLong) {
    fieldErrors.content = `Keep the ${type === "image" ? "link" : "diagram"} under ${cap} characters.`;
  } else if (type === "image" && !normalizeExternalUrl(content.value)) {
    fieldErrors.content = contentHint(type);
  }

  if (Object.keys(fieldErrors).length) {
    return { input: null, fieldErrors };
  }

  return {
    fieldErrors,
    input: {
      problemId,
      type,
      title: title.value,
      content:
        type === "image"
          ? (normalizeExternalUrl(content.value) ?? content.value)
          : content.value,
    },
  };
}

/** Add a visualization to the problem page's UNDERSTAND section. */
export async function createVisualization(
  _prevState: VisualizationFormState,
  formData: FormData
): Promise<VisualizationFormState> {
  const { input, fieldErrors } = parseVisualizationInput(formData);
  if (!input) {
    return visualizationErrorState(
      "Fix the highlighted fields and try again.",
      fieldErrors
    );
  }

  const problem = await getProblem(input.problemId);
  if (!problem) {
    return visualizationErrorState("That problem no longer exists.");
  }

  const visualizationId = await insertVisualization(input);

  revalidateVisualizationPaths(input.problemId);

  return { status: "success", visualizationId };
}

/** Edit an existing visualization from the same form. */
export async function updateVisualizationAction(
  _prevState: VisualizationFormState,
  formData: FormData
): Promise<VisualizationFormState> {
  const visualizationId = text(formData, "visualizationId");
  if (!visualizationId) {
    return visualizationErrorState(
      "Missing visualization id — reopen the problem and try again."
    );
  }

  const { input, fieldErrors } = parseVisualizationInput(formData);
  if (!input) {
    return visualizationErrorState(
      "Fix the highlighted fields and try again.",
      fieldErrors
    );
  }

  const updated = await updateVisualization(visualizationId, input.problemId, input);
  if (!updated) {
    return visualizationErrorState("That visualization no longer exists.");
  }

  revalidateVisualizationPaths(input.problemId);

  return { status: "success", visualizationId };
}

/** Delete one visualization from the UNDERSTAND section. */
export async function deleteVisualizationAction(
  problemId: string,
  visualizationId: string
): Promise<{ ok: boolean; error?: string }> {
  const problem = problemId?.trim();
  const id = visualizationId?.trim();
  if (!problem || !id) {
    return { ok: false, error: "Missing problem or visualization id." };
  }

  const deleted = await deleteVisualization(id, problem);
  if (!deleted) {
    return { ok: false, error: "That visualization no longer exists." };
  }

  revalidateVisualizationPaths(problem);

  return { ok: true };
}
