import { getCloudflareContext } from "@opennextjs/cloudflare";

import type {
  Pattern,
  Problem,
  ProblemStatus,
  ProblemStatusCounts,
  ReviewDueProblem,
  RecentNote,
  PatternWithCount,
  DashboardData,
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

// ---- dashboard ----------------------------------------------------

/** One aggregated query instead of one count per status. */
export function countProblemsByStatus(): Promise<ProblemStatusCounts> {
  return all<{ status: ProblemStatus; n: number }>(
    "SELECT status, COUNT(*) AS n FROM problems GROUP BY status"
  ).then((rows) => {
    const counts: ProblemStatusCounts = {
      learning: 0,
      understood: 0,
      review: 0,
      confusing: 0,
      mastered: 0,
    };
    for (const row of rows) {
      if (row.status in counts) counts[row.status] = row.n;
    }
    return counts;
  });
}

/** Problems still in progress, most recently touched first. */
export function listContinueLearning(limit = 3): Promise<Problem[]> {
  return all<Problem>(
    "SELECT * FROM problems WHERE status != 'mastered' ORDER BY updated_at DESC, created_at DESC, title ASC LIMIT ?",
    limit
  );
}

/**
 * Problems awaiting a revisit: flagged with `status = 'review'` or holding a
 * review whose `next_review_at` has passed. Most overdue first.
 */
export function listProblemsDueForReview(
  limit = 4
): Promise<ReviewDueProblem[]> {
  return all<ReviewDueProblem>(
    `SELECT
       p.id,
       p.title,
       p.category,
       p.difficulty,
       p.status,
       (SELECT MAX(r.reviewed_at) FROM reviews r WHERE r.problem_id = p.id) AS last_reviewed_at,
       CAST(
         julianday('now') - julianday((SELECT MAX(r.reviewed_at) FROM reviews r WHERE r.problem_id = p.id))
         AS INTEGER
       ) AS days_since_review,
       (
         SELECT MIN(r.next_review_at) FROM reviews r
         WHERE r.problem_id = p.id
           AND r.next_review_at IS NOT NULL
           AND r.next_review_at <= datetime('now')
       ) AS due_at
     FROM problems p
     WHERE p.status = 'review'
        OR EXISTS (
          SELECT 1 FROM reviews r
          WHERE r.problem_id = p.id
            AND r.next_review_at IS NOT NULL
            AND r.next_review_at <= datetime('now')
        )
     ORDER BY due_at IS NULL, COALESCE(due_at, p.updated_at) ASC
     LIMIT ?`,
    limit
  );
}

/** The newest notes across every problem, with their problem titles. */
export function listRecentNotes(limit = 4): Promise<RecentNote[]> {
  return all<RecentNote>(
    `SELECT
       n.id,
       n.problem_id,
       n.title,
       n.type,
       n.created_at,
       p.title AS problem_title
     FROM notes n
     JOIN problems p ON p.id = n.problem_id
     ORDER BY n.updated_at DESC, n.created_at DESC
     LIMIT ?`,
    limit
  );
}

/** Patterns ranked by how many problems use them. */
export function listTopPatterns(limit = 6): Promise<PatternWithCount[]> {
  return all<PatternWithCount>(
    `SELECT p.*, COUNT(pp.problem_id) AS problem_count
     FROM patterns p
     LEFT JOIN problem_patterns pp ON pp.pattern_id = p.id
     GROUP BY p.id
     ORDER BY problem_count DESC, p.name ASC
     LIMIT ?`,
    limit
  );
}

/** Everything the dashboard needs, in a single round of queries. */
export function getDashboardData(): Promise<DashboardData> {
  return Promise.all([
    countProblemsByStatus(),
    listContinueLearning(),
    listProblemsDueForReview(),
    listRecentNotes(),
    listTopPatterns(),
  ]).then(
    ([counts, continueLearning, needsReview, recentNotes, topPatterns]) => ({
      total: Object.values(counts).reduce((sum, n) => sum + n, 0),
      counts,
      continueLearning,
      needsReview,
      recentNotes,
      topPatterns,
    })
  );
}