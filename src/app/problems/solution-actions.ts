"use server";

import { revalidatePath } from "next/cache";

import {
  DEFAULT_SOLUTION_LANGUAGE,
  MAX_ALTERNATIVE_CODE_LENGTH,
  MAX_ALTERNATIVE_LABEL_LENGTH,
  MAX_COMPLEXITY_LENGTH,
  MAX_SOLUTION_ALTERNATIVES,
  MAX_SOLUTION_CODE_LENGTH,
  MAX_SOLUTION_EXPLANATION_LENGTH,
  isLanguage,
} from "@/lib/constants";
import {
  deleteSolution,
  getProblem,
  insertSolution,
  updateSolution,
} from "@/lib/db";
import { capAlternatives } from "@/lib/solution-utils";
import type {
  SolutionAlternative,
  SolutionField,
  SolutionFormState,
  SolutionInput,
} from "@/types";

/**
 * Final-solution mutations.
 *
 * Same shape as the problem/note/thinking actions: every export of a
 * `"use server"` file must be async, so the form-facing actions take the
 * `useActionState` shape `(prevState, formData)` and return a serializable
 * {@link SolutionFormState}. The `problemId` travels in a hidden field and is
 * re-validated against D1 before anything is written; edits and deletes carry
 * both ids so a hand-crafted call cannot touch another problem's solution.
 *
 * The product rule this file protects: a solution never overwrites thinking.
 * Both live in separate tables and are only ever written from this form.
 */

/** Only the problem page renders solution data. */
function revalidateSolutionPaths(problemId: string) {
  revalidatePath(`/problems/${problemId}`);
}

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function errorState(
  message: string,
  fieldErrors: Partial<Record<SolutionField, string>> = {}
): SolutionFormState {
  return { status: "error", message, fieldErrors };
}

/**
 * Alternatives travel as parallel arrays (`alternativeLabel[]`, `alternativeCode[]`,
 * `alternativeLanguage[]`) so a plain form submit carries them without JSON
 * parsing on the client. Rows without code are dropped; rows without a label
 * fall back to a generic one.
 */
function parseAlternatives(formData: FormData): SolutionAlternative[] {
  const labels = formData.getAll("alternativeLabel");
  const codes = formData.getAll("alternativeCode");
  const languages = formData.getAll("alternativeLanguage");

  const alternatives: SolutionAlternative[] = [];

  codes.forEach((raw, index) => {
    const code = typeof raw === "string" ? raw.trim() : "";
    if (!code) return;

    const label = (() => {
      const value = labels[index];
      return typeof value === "string" ? value.trim() : "";
    })();

    const language = (() => {
      const value = languages[index];
      return typeof value === "string" ? value.trim() : "";
    })();

    alternatives.push({
      label: (label || "Alternative").slice(0, MAX_ALTERNATIVE_LABEL_LENGTH),
      code: code.slice(0, MAX_ALTERNATIVE_CODE_LENGTH),
      ...(isLanguage(language) ? { language } : {}),
    });
  });

  return capAlternatives(alternatives);
}

/** Validate raw `FormData` into a {@link SolutionInput}. */
function parseSolutionInput(formData: FormData): {
  input: SolutionInput | null;
  fieldErrors: Partial<Record<SolutionField, string>>;
} {
  const fieldErrors: Partial<Record<SolutionField, string>> = {};

  const problemId = text(formData, "problemId");
  if (!problemId) {
    return {
      input: null,
      fieldErrors: { code: "Missing problem id — reopen the problem and try again." },
    };
  }

  const language = text(formData, "language");
  if (!isLanguage(language)) {
    fieldErrors.language = "Pick the language this solution is written in.";
  }

  const code = text(formData, "code");
  if (!code) {
    fieldErrors.code = "Write the solution you want to keep.";
  } else if (code.length > MAX_SOLUTION_CODE_LENGTH) {
    fieldErrors.code = `Keep the code under ${MAX_SOLUTION_CODE_LENGTH} characters.`;
  }

  const timeComplexity = text(formData, "timeComplexity").slice(
    0,
    MAX_COMPLEXITY_LENGTH
  );
  const spaceComplexity = text(formData, "spaceComplexity").slice(
    0,
    MAX_COMPLEXITY_LENGTH
  );

  const rawExplanation = text(formData, "explanation");
  if (rawExplanation.length > MAX_SOLUTION_EXPLANATION_LENGTH) {
    fieldErrors.explanation = `Keep the explanation under ${MAX_SOLUTION_EXPLANATION_LENGTH} characters.`;
  }

  const alternatives = parseAlternatives(formData);
  if (
    formData.getAll("alternativeCode").filter(
      (value) => typeof value === "string" && value.trim()
    ).length > MAX_SOLUTION_ALTERNATIVES
  ) {
    fieldErrors.alternatives = `Keep at most ${MAX_SOLUTION_ALTERNATIVES} alternative solutions.`;
  }

  if (Object.keys(fieldErrors).length) {
    return { input: null, fieldErrors };
  }

  return {
    fieldErrors,
    input: {
      problemId,
      language: isLanguage(language) ? language : DEFAULT_SOLUTION_LANGUAGE,
      code,
      timeComplexity: timeComplexity || null,
      spaceComplexity: spaceComplexity || null,
      explanation: rawExplanation || null,
      alternatives,
    },
  };
}

/** Store a final solution from the problem page's SOLUTION section. */
export async function createSolution(
  _prevState: SolutionFormState,
  formData: FormData
): Promise<SolutionFormState> {
  const { input, fieldErrors } = parseSolutionInput(formData);
  if (!input) {
    return errorState("Fix the highlighted fields and try again.", fieldErrors);
  }

  const problem = await getProblem(input.problemId);
  if (!problem) {
    return errorState("That problem no longer exists.");
  }

  const solutionId = await insertSolution(input);

  revalidateSolutionPaths(input.problemId);

  return { status: "success", solutionId };
}

/** Edit an existing solution from the same form. */
export async function updateSolutionAction(
  _prevState: SolutionFormState,
  formData: FormData
): Promise<SolutionFormState> {
  const solutionId = text(formData, "solutionId");
  if (!solutionId) {
    return errorState("Missing solution id — reopen the problem and try again.");
  }

  const { input, fieldErrors } = parseSolutionInput(formData);
  if (!input) {
    return errorState("Fix the highlighted fields and try again.", fieldErrors);
  }

  const updated = await updateSolution(solutionId, input.problemId, input);
  if (!updated) {
    return errorState("That solution no longer exists.");
  }

  revalidateSolutionPaths(input.problemId);

  return { status: "success", solutionId };
}

/** Delete one solution from the SOLUTION section. */
export async function deleteSolutionAction(
  problemId: string,
  solutionId: string
): Promise<{ ok: boolean; error?: string }> {
  const problem = problemId?.trim();
  const id = solutionId?.trim();
  if (!problem || !id) {
    return { ok: false, error: "Missing problem or solution id." };
  }

  const deleted = await deleteSolution(id, problem);
  if (!deleted) {
    return { ok: false, error: "That solution no longer exists." };
  }

  revalidateSolutionPaths(problem);

  return { ok: true };
}
