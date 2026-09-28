"use server";

import { revalidatePath } from "next/cache";

import {
  DEFAULT_CATEGORY,
  MAX_DESCRIPTION_LENGTH,
  MAX_MENTAL_MODEL_LENGTH,
  MAX_SHORT_LENGTH,
  MAX_SIGNALS,
  MAX_TITLE_LENGTH,
} from "@/lib/constants";
import {
  getPatternBySlug,
  insertPattern,
  updatePatternMentalModel,
} from "@/lib/db";
import { countSignalLines, normalizeSignals } from "@/lib/pattern-utils";
import { slugify } from "@/lib/utils";
import type {
  MentalModelFormState,
  PatternField,
  PatternFormState,
  PatternInput,
} from "@/types";

/**
 * Pattern mutations.
 *
 * Same shape as the problem actions: every export of a `"use server"` file
 * must be async, so the form-facing actions take `(prevState, formData)` and
 * return a serializable state object. The affected routes are revalidated
 * after each write so the same response already carries fresh markup.
 */

/** The routes that render pattern data: the library, a pattern page, the dashboard. */
function revalidatePatternPaths(slug?: string) {
  revalidatePath("/patterns");
  revalidatePath("/");
  if (slug) revalidatePath(`/patterns/${slug}`);
}

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function errorState(
  message: string,
  fieldErrors: Partial<Record<PatternField, string>> = {}
): PatternFormState {
  return { status: "error", message, fieldErrors };
}

/**
 * Validate raw `FormData` into a {@link PatternInput}. The slug is derived
 * from the name; a clash with an existing pattern is reported on the name
 * field rather than thrown by the UNIQUE constraint.
 */
function parsePatternInput(formData: FormData): {
  input: PatternInput | null;
  fieldErrors: Partial<Record<PatternField, string>>;
  slug: string;
} {
  const fieldErrors: Partial<Record<PatternField, string>> = {};

  const name = text(formData, "name");
  if (!name) {
    fieldErrors.name = "A name is required.";
  } else if (name.length > MAX_TITLE_LENGTH) {
    fieldErrors.name = `Keep the name under ${MAX_TITLE_LENGTH} characters.`;
  }

  const slug = slugify(name);
  if (name && !slug) {
    fieldErrors.name = "Use at least one letter or digit in the name.";
  }

  const category = text(formData, "category").slice(0, MAX_SHORT_LENGTH);
  if (category.length > MAX_SHORT_LENGTH) {
    fieldErrors.category = `Keep the category under ${MAX_SHORT_LENGTH} characters.`;
  }

  const description = text(formData, "description");
  if (description.length > MAX_DESCRIPTION_LENGTH) {
    fieldErrors.description = `Keep the description under ${MAX_DESCRIPTION_LENGTH} characters.`;
  }

  const mentalModel = text(formData, "mentalModel");
  if (mentalModel.length > MAX_MENTAL_MODEL_LENGTH) {
    fieldErrors.mentalModel = `Keep the mental model under ${MAX_MENTAL_MODEL_LENGTH} characters.`;
  }

  const rawSignals = text(formData, "commonSignals");
  if (countSignalLines(rawSignals) > MAX_SIGNALS) {
    fieldErrors.commonSignals = `Keep at most ${MAX_SIGNALS} signals, one per line.`;
  }

  if (Object.keys(fieldErrors).length || !slug) {
    return { input: null, fieldErrors, slug };
  }

  return {
    fieldErrors,
    slug,
    input: {
      name,
      category: category || DEFAULT_CATEGORY,
      description: description || null,
      mentalModel: mentalModel || null,
      commonSignals: normalizeSignals(rawSignals),
    },
  };
}

/** Create a pattern from the library modal. */
export async function createPattern(
  _prevState: PatternFormState,
  formData: FormData
): Promise<PatternFormState> {
  const { input, fieldErrors, slug } = parsePatternInput(formData);
  if (!input) {
    return errorState("Fix the highlighted fields and try again.", fieldErrors);
  }

  const existing = await getPatternBySlug(slug);
  if (existing) {
    return errorState("That pattern already exists.", {
      name: `“${existing.name}” already uses this name.`,
    });
  }

  await insertPattern(input);

  revalidatePatternPaths(slug);

  return { status: "success", slug };
}

/** Inline edit of a pattern's mental model from its knowledge page. */
export async function updatePatternMentalModelAction(
  _prevState: MentalModelFormState,
  formData: FormData
): Promise<MentalModelFormState> {
  const patternId = text(formData, "patternId");
  if (!patternId) {
    return { status: "error", message: "Missing pattern id — reopen the page and try again." };
  }

  const slug = text(formData, "slug");

  const mentalModel = text(formData, "mentalModel");
  if (mentalModel.length > MAX_MENTAL_MODEL_LENGTH) {
    return {
      status: "error",
      message: `Keep the mental model under ${MAX_MENTAL_MODEL_LENGTH} characters.`,
    };
  }

  const updated = await updatePatternMentalModel(patternId, mentalModel || null);
  if (!updated) {
    return { status: "error", message: "That pattern no longer exists." };
  }

  revalidatePatternPaths(slug || undefined);

  return { status: "success" };
}
