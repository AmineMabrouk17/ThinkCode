import type { AiProvider } from "@/types";

/**
 * URL helpers for the AI and RESOURCES sections.
 *
 * Everything here is pure and framework-free so it can run on the server
 * (validation in the actions) and on the client (guessing the provider while
 * the user types) without dragging React or the D1 binding in.
 *
 * The product rule these helpers serve: ThinkCode stores the *link* to a
 * conversation or a video, not a copy of its content.
 */

/**
 * A YouTube video id is 11 characters of `[A-Za-z0-9_-]`. Anything else is
 * rejected, which is what makes it safe to drop the id straight into a
 * thumbnail URL and an iframe `src`.
 */
const YOUTUBE_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

/** Path prefixes that carry the video id as the segment right after them. */
const YOUTUBE_PATH_PREFIXES = ["embed", "shorts", "v", "live"];

const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "gaming.youtube.com",
  "youtube-nocookie.com",
]);

/** Parse a URL, accepting only absolute `http(s)` ones. */
function parseHttpUrl(url: string | null | undefined): URL | null {
  if (!url) return null;

  let parsed: URL;
  try {
    parsed = new URL(url.trim());
  } catch {
    return null;
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
  return parsed;
}

/** Host without the `www.` prefix, lowercased — `chatgpt.com`, `youtu.be`. */
export function urlHost(url: string | null | undefined): string | null {
  const parsed = parseHttpUrl(url);
  if (!parsed) return null;
  return parsed.hostname.toLowerCase().replace(/^www\./, "");
}

/**
 * Validate a user-supplied link and return it in normalized form, or `null`
 * when it is not an absolute `http(s)` URL.
 *
 * Parsing with `new URL()` (instead of a regex) is what rejects
 * `javascript:alert(1)`, `data:…`, `ftp://…` and relative paths: only `http:`
 * and `https:` survive, so a stored link can never execute anything when it is
 * rendered as an anchor.
 */
export function normalizeExternalUrl(value: string): string | null {
  const parsed = parseHttpUrl(value);
  return parsed ? parsed.href : null;
}

/** Whether a link is safe to store and to render as an external anchor. */
export function isExternalUrl(value: string): boolean {
  return normalizeExternalUrl(value) !== null;
}

/**
 * The YouTube video id behind a link, or `null` when it is not a video link.
 *
 * Handles the shapes people actually paste:
 * `youtube.com/watch?v=ID` (with any extra query params), `youtu.be/ID`,
 * `/embed/ID`, `/shorts/ID`, `/live/ID` and `/v/ID`, on the mobile, music, and
 * `youtube-nocookie` hosts as well.
 */
export function youtubeId(url: string | null | undefined): string | null {
  const parsed = parseHttpUrl(url);
  if (!parsed) return null;

  const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
  const segments = parsed.pathname.split("/").filter(Boolean);

  if (host === "youtu.be") {
    return validId(segments[0]);
  }

  if (!YOUTUBE_HOSTS.has(host)) return null;

  if (segments[0] === "watch") {
    return validId(parsed.searchParams.get("v"));
  }

  if (segments.length >= 2 && YOUTUBE_PATH_PREFIXES.includes(segments[0])) {
    return validId(segments[1]);
  }

  return null;
}

function validId(candidate: string | null | undefined): string | null {
  return candidate && YOUTUBE_ID_PATTERN.test(candidate) ? candidate : null;
}

/** Thumbnail for a YouTube id, at the 480×360 "high quality" size. */
export function youtubeThumbnail(id: string): string {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

/**
 * Privacy-friendly embed for a YouTube id, used by the inline "Play here"
 * toggle: `youtube-nocookie.com` sets no tracking cookies until you press play.
 */
export function youtubeEmbedUrl(id: string): string {
  return `https://www.youtube-nocookie.com/embed/${id}?rel=0`;
}

/**
 * Best-effort guess of which tool a conversation link came from, used to
 * preselect the provider in the form while the URL is typed or pasted.
 * Returns `null` for anything unrecognized so the current choice is kept.
 */
export function providerFromUrl(
  url: string | null | undefined
): AiProvider | null {
  const host = urlHost(url);
  if (!host) return null;

  if (host === "chatgpt.com" || host === "chat.openai.com") return "ChatGPT";
  if (host.endsWith("chatgpt.com")) return "ChatGPT";
  if (host === "aistudio.google.com" || host === "makersuite.google.com") {
    return "AI Studio";
  }
  if (host === "claude.ai" || host.endsWith(".claude.ai")) return "Claude";
  if (host === "anthropic.com" || host.endsWith(".anthropic.com")) return "Claude";

  return null;
}

/** `true` when the link points at a YouTube video, whatever its shape. */
export function isYoutubeUrl(url: string | null | undefined): boolean {
  return youtubeId(url) !== null;
}
