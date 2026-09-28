import { MAX_SIGNAL_LENGTH, MAX_SIGNALS } from "@/lib/constants";

/**
 * Signals are stored one per line. The seed writes them with an escaped `\n`
 * inside a single-quoted SQL literal, so rows in the wild hold either a real
 * newline or a literal backslash-n. Both are treated as a line break.
 */
function toLines(raw: string): string[] {
  return raw
    .split(/\\n|\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

/**
 * Normalize the "one signal per line" textarea: blank lines out, each line
 * trimmed and length-capped. Returns `null` when nothing is left so the column
 * stays NULL instead of holding an empty string.
 */
export function normalizeSignals(raw: string): string | null {
  const lines = toLines(raw)
    .slice(0, MAX_SIGNALS)
    .map((line) => line.slice(0, MAX_SIGNAL_LENGTH));

  return lines.length ? lines.join("\n") : null;
}

/** How many non-empty signal lines a raw textarea holds (before the cap). */
export function countSignalLines(raw: string): number {
  return toLines(raw).length;
}

/** Split a stored `common_signals` column into trimmed, non-empty lines. */
export function splitSignals(raw: string | null | undefined): string[] {
  return raw ? toLines(raw) : [];
}
