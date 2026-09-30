import { getCloudflareContext } from "@opennextjs/cloudflare";

import { searchEverything } from "@/lib/db";
import type { GlobalSearchResults } from "@/types";

export const dynamic = "force-dynamic";

const NOTHING: GlobalSearchResults = { term: "", groups: [], total: 0 };

/**
 * The global search endpoint behind the header's ⌘K palette.
 *
 * A route handler rather than a page: the palette has to answer on every
 * keystroke, and a Server Action would round-trip through the form-action
 * machinery for something that is purely a query. The response is JSON with a
 * `kind` per group so the client can group without a second request.
 */
export async function GET(request: Request) {
  const term = new URL(request.url).searchParams.get("q")?.trim() ?? "";

  if (term.length < 2) {
    return Response.json({ ...NOTHING, term });
  }

  // Without a Cloudflare context there is no D1 binding to query — a build-time
  // render, or a preview worker. Answer with nothing rather than throwing.
  const context = await getCloudflareContext();
  if (!context) {
    return Response.json({ ...NOTHING, term });
  }

  return Response.json(await searchEverything(term));
}
