import {
  LANGUAGE_LABELS,
  MAX_SOLUTION_ALTERNATIVES,
  type SolutionLanguage,
  isLanguage,
} from "@/lib/constants";
import type { SolutionAlternative } from "@/types";

/**
 * Helpers for the SOLUTION section: the `alternatives` column is a JSON array
 * string, and a stored solution is rendered by handing its code to the shared
 * markdown renderer inside a fenced block so it picks up syntax highlighting.
 */

/** Parse the `alternatives` column. Bad or legacy JSON yields `[]`, never a throw. */
export function parseAlternatives(raw: string | null | undefined): SolutionAlternative[] {
  if (!raw) return [];

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((entry): SolutionAlternative | null => {
        if (typeof entry !== "object" || entry === null) return null;
        const { label, code, language } = entry as Record<string, unknown>;
        if (typeof code !== "string" || !code.trim()) return null;
        return {
          label: typeof label === "string" ? label : "Alternative",
          code,
          ...(typeof language === "string" ? { language } : {}),
        };
      })
      .filter((entry): entry is SolutionAlternative => entry !== null);
  } catch {
    return [];
  }
}

/** Serialize alternatives for storage; empty means "none", stored as `[]`. */
export function serializeAlternatives(
  alternatives: SolutionAlternative[]
): string | null {
  if (!alternatives.length) return null;
  return JSON.stringify(alternatives);
}

/**
 * Wrap code in a fenced markdown block so the existing `Markdown` renderer
 * highlights it. A fence longer than any backtick run inside the code keeps
 * user code from breaking out of the block.
 */
export function codeFence(code: string, language: string): string {
  const longestRun = [...code.matchAll(/`+/g)].reduce(
    (longest, match) => Math.max(longest, match[0].length),
    0
  );
  const fence = "`".repeat(Math.max(3, longestRun + 1));

  return `${fence}${language}\n${code.replace(/\s+$/, "")}\n${fence}`;
}

/** "python" -> "Python", unknown values pass through untouched. */
export function languageLabel(language: string): string {
  return isLanguage(language) ? LANGUAGE_LABELS[language] : language;
}

/** CodeMirror mode lookup key; unknown languages fall back to plain text. */
export function editorMode(language: string): SolutionLanguage | "text" {
  return isLanguage(language) ? language : "text";
}

/** Clamp a form's alternative rows to what the server will accept. */
export function capAlternatives(
  alternatives: SolutionAlternative[]
): SolutionAlternative[] {
  return alternatives.slice(0, MAX_SOLUTION_ALTERNATIVES);
}
