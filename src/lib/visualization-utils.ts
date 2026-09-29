import { VISUALIZATION_BADGE_LABELS, VISUALIZATION_LABELS } from "@/lib/constants";
import { urlHost } from "@/lib/resource-utils";
import type { Visualization, VisualizationType } from "@/types";

/**
 * Pure helpers for the UNDERSTAND section.
 *
 * Same split as `resource-utils`: everything here is framework-free so it can
 * run in the server actions, in the client cards, and in the shared renderer
 * without dragging React or the D1 binding in.
 *
 * The product rule these helpers serve: a visualization is something *you*
 * drew to make the algorithm click. An image is only ever a link to it —
 * ThinkCode has no upload and no file storage, so the bytes stay on the host
 * they already lived on.
 */

/** Short label for a type badge: "Mermaid", "Diagram", "Image". */
export function visualizationBadgeLabel(type: VisualizationType): string {
  return VISUALIZATION_BADGE_LABELS[type];
}

/** Long label for selects and form copy: "Mermaid diagram", … */
export function visualizationLabel(type: VisualizationType): string {
  return VISUALIZATION_LABELS[type];
}

/**
 * The image URL of a stored `image` row, or `null` when the content is not a
 * renderable `http(s)` URL.
 *
 * The action already gates every write through the same parser, so this is the
 * belt to that braces: a hand-edited D1 row (or a row written by an older
 * build) can never turn into a `javascript:` href or an `<img src>`.
 */
export function visualizationImageUrl(visualization: Visualization): string | null {
  if (visualization.type !== "image") return null;
  return urlHost(visualization.content) ? visualization.content : null;
}

/** Host shown next to an image card, e.g. `imgur.com`. */
export function visualizationImageHost(visualization: Visualization): string | null {
  return urlHost(visualization.content);
}

/** How many lines a text diagram has — shown as a tiny hint on the card. */
export function diagramLineCount(content: string): number {
  return content ? content.split("\n").length : 0;
}

/**
 * A Mermaid-safe element id.
 *
 * Mermaid embeds the id in the generated SVG (and in the CSS selectors that
 * go with it), so it must survive being used as an id. React's `useId` is
 * stable and collision-free per component, which is exactly what is needed —
 * it only has to be scrubbed of the characters the SVG grammar cannot carry.
 */
export function mermaidRenderId(seed: string): string {
  const scrubbed = seed.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return `thinkcode-mermaid-${scrubbed || "diagram"}`;
}
