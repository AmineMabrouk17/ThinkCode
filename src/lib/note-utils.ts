import { NOTE_EXCERPT_LENGTH } from "@/lib/constants";

/**
 * Small markdown helpers shared by the note actions (server) and the
 * `/knowledge` cards (server). The editor itself does not use them — it
 * renders through react-markdown instead.
 */

/**
 * Flatten markdown to readable plain text: strip fenced code markers, inline
 * emphasis, links, images, headings, list bullets, and tables. Deliberately
 * regex-based and forgiving — it only has to produce a one-line excerpt.
 */
export function stripMarkdown(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, " ") // fenced code blocks
    .replace(/~~~[\s\S]*?~~~/g, " ")
    .replace(/`([^`]*)`/g, "$1") // inline code
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1") // images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // links
    .replace(/^\s{0,3}#{1,6}\s+/gm, "") // headings
    .replace(/^\s{0,3}>\s?/gm, "") // block quotes
    .replace(/^\s{0,3}([-*+]|\d+\.)\s+/gm, "") // list bullets
    .replace(/^\s*\|.*\|\s*$/gm, (row) => row.replace(/\|/g, " ")) // tables
    .replace(/^\s*[-:| ]+\s*$/gm, " ") // table rules
    .replace(/(\*\*\*|___)(.*?)\1/g, "$2")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    .replace(/~~(.*?)~~/g, "$1")
    .replace(/<[^>]+>/g, " ") // stray inline html
    .replace(/\s+/g, " ")
    .trim();
}

/** A one-line plain-text excerpt of a note body, capped at `limit` characters. */
export function noteExcerpt(markdown: string, limit = NOTE_EXCERPT_LENGTH): string {
  const text = stripMarkdown(markdown);
  if (text.length <= limit) return text;
  const cut = text.slice(0, limit);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > limit * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

/**
 * The first meaningful line of a note, used as the fallback title when the
 * user leaves the title empty. Markdown decoration (`#`, `**`, `-`) comes off
 * so a heading body reads as a title.
 */
export function firstLineOf(markdown: string): string {
  const line = markdown
    .split(/\r?\n/)
    .map((entry) => entry.trim())
    .find((entry) => entry.length > 0);

  if (!line) return "";
  return stripMarkdown(line).replace(/^#+\s*/, "").trim();
}
