/**
 * Text helpers for the global search palette.
 *
 * The palette matches on raw text but shows fragments of it, so anything that
 * would read as markup — a note's `#` headings, a solution's backticks, a stray
 * `<` from pasted prose — has to be flattened before it reaches a result row.
 */

/**
 * Flatten markdown to readable plain text for an excerpt.
 *
 * Fenced code is dropped rather than flattened: half a code block reads as
 * noise, and the title line above it already says which problem or pattern it
 * belongs to. Inline markers are stripped rather than replaced, so "**why** the
 * complement" becomes "why the complement".
 */
export function stripMarkdown(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/~~~[\s\S]*?~~~/g, " ")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s{0,3}>\s?/gm, "")
    .replace(/^\s{0,3}([-*+]|\d+\.)\s+/gm, "")
    .replace(/(\*\*|__|\*|_|~~)/g, "")
    .replace(/\|/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Cut an excerpt to `limit` characters on a word boundary, marking the cut with
 * an ellipsis. The leading whitespace of the body is dropped first, since notes
 * usually open with a heading.
 */
export function excerpt(text: string, limit = 140): string {
  const flat = stripMarkdown(text);
  if (flat.length <= limit) return flat;

  const cut = flat.slice(0, limit);
  const boundary = cut.lastIndexOf(" ");

  return `${(boundary > limit * 0.6 ? cut.slice(0, boundary) : cut).trimEnd()}…`;
}

/**
 * Split `text` on every case-insensitive occurrence of `term`, so the palette
 * can wrap matches in a `<mark>` without using `dangerouslySetInnerHTML`.
 *
 * Returns alternating segments: unmatched, matched, unmatched, … The caller
 * renders even indices as plain text and odd indices as highlighted.
 */
export function highlightSegments(
  text: string,
  term: string
): Array<{ text: string; match: boolean }> {
  const needle = term.trim();
  if (needle.length < 2) return [{ text, match: false }];

  const haystack = text.toLowerCase();
  const target = needle.toLowerCase();
  const segments: Array<{ text: string; match: boolean }> = [];

  let cursor = 0;
  let found = haystack.indexOf(target, cursor);

  while (found !== -1) {
    if (found > cursor) {
      segments.push({ text: text.slice(cursor, found), match: false });
    }
    segments.push({ text: text.slice(found, found + needle.length), match: true });
    cursor = found + needle.length;
    found = haystack.indexOf(target, cursor);
  }

  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), match: false });
  }

  return segments.length ? segments : [{ text, match: false }];
}
