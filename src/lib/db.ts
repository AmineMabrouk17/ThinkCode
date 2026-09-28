import { getCloudflareContext } from "@opennextjs/cloudflare";

import type {
  Pattern,
  Problem,
  Tag,
  ThinkingSession,
  Note,
  Review,
  Solution,
  Resource,
  Visualization,
  AiConversation,
} from "@/types";

/**
 * Returns the typed Cloudflare D1 binding.
 *
 * Callers must invoke this from inside a route/component body (never at
 * module top level) so the pages stay buildable without a live D1.
 * `getCloudflareContext` is resolved via the OpenNext Cloudflare platform
 * proxy bound in `next.config.ts` during `next dev`.
 */
export async function getDB(): Promise<D1Database> {
  const { env } = await getCloudflareContext({ async: true });
  return env.DB;
}

async function all<T>(sql: string, ...bind: unknown[]): Promise<T[]> {
  const db = await getDB();
  const { results } = await db.prepare(sql).bind(...bind).all<T>();
  return results;
}

async function first<T>(sql: string, ...bind: unknown[]): Promise<T | null> {
  const db = await getDB();
  const row = await db.prepare(sql).bind(...bind).first<T>();
  return row ?? null;
}

// ---- problems ----------------------------------------------------

export function countProblems(): Promise<number> {
  return all<{ n: number }>("SELECT COUNT(*) AS n FROM problems").then(
    (rows) => rows[0]?.n ?? 0
  );
}

export function listProblems(): Promise<Problem[]> {
  return all<Problem>(
    "SELECT * FROM problems ORDER BY created_at DESC, title ASC"
  );
}

export function getProblem(id: string): Promise<Problem | null> {
  return first<Problem>("SELECT * FROM problems WHERE id = ?", id);
}

// ---- patterns ----------------------------------------------------

export function countPatterns(): Promise<number> {
  return all<{ n: number }>("SELECT COUNT(*) AS n FROM patterns").then(
    (rows) => rows[0]?.n ?? 0
  );
}

export function listPatterns(): Promise<Pattern[]> {
  return all<Pattern>("SELECT * FROM patterns ORDER BY category, name");
}

// ---- tags --------------------------------------------------------

export function listTags(): Promise<Tag[]> {
  return all<Tag>("SELECT * FROM tags ORDER BY name");
}

// ---- per-problem records ------------------------------------------

export function listThinkingSessions(
  problemId: string
): Promise<ThinkingSession[]> {
  return all<ThinkingSession>(
    "SELECT * FROM thinking_sessions WHERE problem_id = ? ORDER BY started_at DESC",
    problemId
  );
}

export function listNotes(problemId: string): Promise<Note[]> {
  return all<Note>(
    "SELECT * FROM notes WHERE problem_id = ? ORDER BY created_at DESC",
    problemId
  );
}

export function listReviews(problemId: string): Promise<Review[]> {
  return all<Review>(
    "SELECT * FROM reviews WHERE problem_id = ? ORDER BY reviewed_at DESC",
    problemId
  );
}

export function listSolutions(problemId: string): Promise<Solution[]> {
  return all<Solution>(
    "SELECT * FROM solutions WHERE problem_id = ? ORDER BY created_at DESC",
    problemId
  );
}

export function listResources(problemId: string): Promise<Resource[]> {
  return all<Resource>(
    "SELECT * FROM resources WHERE problem_id = ? ORDER BY created_at DESC",
    problemId
  );
}

export function listVisualizations(
  problemId: string
): Promise<Visualization[]> {
  return all<Visualization>(
    "SELECT * FROM visualizations WHERE problem_id = ? ORDER BY created_at DESC",
    problemId
  );
}

export function listAiConversations(
  problemId: string
): Promise<AiConversation[]> {
  return all<AiConversation>(
    "SELECT * FROM ai_conversations WHERE problem_id = ? ORDER BY created_at DESC",
    problemId
  );
}