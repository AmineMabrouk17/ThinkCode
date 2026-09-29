import { getCloudflareContext } from "@opennextjs/cloudflare";

import {
  MAX_TAG_LENGTH,
  MAX_TAGS,
  isDifficulty,
  isNoteType,
  isProblemStatus,
} from "@/lib/constants";
import { slugify } from "@/lib/utils";
import type {
  AiConversation,
  AiConversationInput,
  DashboardData,
  Note,
  NoteFilters,
  NoteInput,
  NoteType,
  NoteTypeCounts,
  NoteWithProblem,
  Pattern,
  PatternInput,
  PatternWithCount,
  Problem,
  ProblemFilters,
  ProblemInput,
  ProblemRecords,
  ProblemStatus,
  ProblemStatusCounts,
  ProblemWithMeta,
  RecentNote,
  Resource,
  ResourceInput,
  Review,
  ReviewDueProblem,
  Solution,
  SolutionInput,
  Tag,
  TagWithCount,
  ThinkingSession,
  ThinkingSessionInput,
  Visualization,
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

async function run(sql: string, ...bind: unknown[]): Promise<D1Result> {
  const db = await getDB();
  return db.prepare(sql).bind(...bind).run();
}

/** `IN (?, ?, ?)` placeholder list, or `NULL` for an empty array. */
function placeholders(values: readonly string[]): string {
  return values.length ? values.map(() => "?").join(", ") : "NULL";
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

/**
 * The library query. Every filter is optional and combined with AND; unknown
 * enum values are ignored instead of producing an empty result, and the
 * pattern/tag filters use correlated `EXISTS` subqueries so a problem is
 * returned once no matter how many patterns or tags it carries.
 */
export function listProblemsFiltered(
  filters: ProblemFilters = {}
): Promise<ProblemWithMeta[]> {
  const clauses: string[] = [];
  const binds: unknown[] = [];

  const q = filters.q?.trim();
  if (q) {
    // Escape LIKE wildcards so a literal `%` cannot widen the search.
    const like = `%${q.toLowerCase().replace(/[\\%_]/g, "\\$&")}%`;
    clauses.push(
      "(LOWER(p.title) LIKE ? ESCAPE '\\' OR LOWER(IFNULL(p.description, '')) LIKE ? ESCAPE '\\')"
    );
    binds.push(like, like);
  }

  if (filters.platform) {
    clauses.push("LOWER(p.platform) = ?");
    binds.push(filters.platform.toLowerCase());
  }

  if (filters.difficulty && isDifficulty(filters.difficulty)) {
    clauses.push("p.difficulty = ?");
    binds.push(filters.difficulty);
  }

  if (filters.status && isProblemStatus(filters.status)) {
    clauses.push("p.status = ?");
    binds.push(filters.status);
  }

  if (filters.category) {
    clauses.push("LOWER(p.category) = ?");
    binds.push(filters.category.toLowerCase());
  }

  if (filters.pattern) {
    clauses.push(
      `EXISTS (
         SELECT 1 FROM problem_patterns pp
         JOIN patterns pat ON pat.id = pp.pattern_id
         WHERE pp.problem_id = p.id AND pat.slug = ?
       )`
    );
    binds.push(filters.pattern);
  }

  if (filters.tag) {
    clauses.push(
      `EXISTS (
         SELECT 1 FROM problem_tags pt
         JOIN tags t ON t.id = pt.tag_id
         WHERE pt.problem_id = p.id AND t.slug = ?
       )`
    );
    binds.push(filters.tag);
  }

  const where = clauses.length ? `WHERE ${clauses.join("\n   AND ")}` : "";

  return all<Problem>(
    `SELECT p.*
     FROM problems p
     ${where}
     ORDER BY p.updated_at DESC, p.title ASC`,
    ...binds
  ).then((rows) => attachMeta(rows));
}

export function listDistinctCategories(): Promise<string[]> {
  return all<{ category: string }>(
    "SELECT DISTINCT category FROM problems WHERE category <> '' ORDER BY category COLLATE NOCASE"
  ).then((rows) => rows.map((row) => row.category));
}

export function listDistinctPlatforms(): Promise<string[]> {
  return all<{ platform: string }>(
    "SELECT DISTINCT platform FROM problems WHERE platform <> '' ORDER BY platform COLLATE NOCASE"
  ).then((rows) => rows.map((row) => row.platform));
}

/** A problem with its patterns and tags — everything the header renders. */
export async function getProblemDetail(
  id: string
): Promise<ProblemWithMeta | null> {
  const problem = await getProblem(id);
  if (!problem) return null;

  const [patterns, tags] = await Promise.all([
    listProblemPatterns(id),
    listProblemTags(id),
  ]);

  return { ...problem, patterns, tags };
}

export function listProblemPatterns(problemId: string): Promise<Pattern[]> {
  return all<Pattern>(
    `SELECT pat.* FROM patterns pat
     JOIN problem_patterns pp ON pp.pattern_id = pat.id
     WHERE pp.problem_id = ?
     ORDER BY pat.category, pat.name`,
    problemId
  );
}

export function listProblemTags(problemId: string): Promise<Tag[]> {
  return all<Tag>(
    `SELECT t.* FROM tags t
     JOIN problem_tags pt ON pt.tag_id = t.id
     WHERE pt.problem_id = ?
     ORDER BY t.name`,
    problemId
  );
}

/** Every per-problem record the detail page lists, in one round of queries. */
export function getProblemRecords(problemId: string): Promise<ProblemRecords> {
  return Promise.all([
    listThinkingSessions(problemId),
    listAiConversations(problemId),
    listResources(problemId),
    listVisualizations(problemId),
    listNotes(problemId),
    listSolutions(problemId),
    listReviews(problemId),
  ]).then(
    ([sessions, aiConversations, resources, visualizations, notes, solutions, reviews]) => ({
      sessions,
      aiConversations,
      resources,
      visualizations,
      notes,
      solutions,
      reviews,
    })
  );
}

// ---- problem mutations -------------------------------------------

/** Insert a problem and link its patterns/tags. Returns the new id. */
export async function insertProblem(input: ProblemInput): Promise<string> {
  const db = await getDB();
  const id = crypto.randomUUID();

  await db
    .prepare(
      `INSERT INTO problems
         (id, title, platform, external_url, difficulty, category, status, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      input.title,
      input.platform,
      input.externalUrl,
      input.difficulty,
      input.category,
      input.status,
      input.description
    )
    .run();

  await relinkProblem(db, id, input.patternIds, input.tags);

  return id;
}

/** Update a problem in place and re-link its patterns/tags. */
export async function updateProblemById(
  id: string,
  input: ProblemInput
): Promise<boolean> {
  const db = await getDB();

  const result = await db
    .prepare(
      `UPDATE problems
       SET title = ?,
           platform = ?,
           external_url = ?,
           difficulty = ?,
           category = ?,
           status = ?,
           description = ?,
           updated_at = datetime('now')
       WHERE id = ?`
    )
    .bind(
      input.title,
      input.platform,
      input.externalUrl,
      input.difficulty,
      input.category,
      input.status,
      input.description,
      id
    )
    .run();

  if (!result.meta.changes) return false;

  await relinkProblem(db, id, input.patternIds, input.tags);

  return true;
}

/** Quick status switch from the problem header. */
export async function updateProblemStatusById(
  id: string,
  status: ProblemStatus
): Promise<boolean> {
  const result = await run(
    "UPDATE problems SET status = ?, updated_at = datetime('now') WHERE id = ?",
    status,
    id
  );
  return result.meta.changes > 0;
}

/**
 * Delete a problem and everything hanging off it, in one D1 batch. Order
 * matters: the join tables and child rows first, the problem row last.
 */
export async function deleteProblemById(id: string): Promise<boolean> {
  const db = await getDB();

  const cascade = [
    "problem_patterns",
    "problem_tags",
    "thinking_sessions",
    "ai_conversations",
    "resources",
    "visualizations",
    "notes",
    "solutions",
    "reviews",
  ] as const;

  const result = await db.batch([
    ...cascade.map((table) =>
      db.prepare(`DELETE FROM ${table} WHERE problem_id = ?`).bind(id)
    ),
    db.prepare("DELETE FROM problems WHERE id = ?").bind(id),
  ]);

  return (result[result.length - 1]?.meta.changes ?? 0) > 0;
}

/**
 * Re-link a problem to exactly the given patterns and tags: existing links are
 * dropped, unknown pattern ids are ignored, and unknown tag names are created
 * (slugified) on the fly. Everything runs as a single D1 batch.
 */
async function relinkProblem(
  db: D1Database,
  problemId: string,
  patternIds: string[],
  tagNames: string[]
): Promise<void> {
  // Guard rails: the form is the only caller, so these caps just stop a
  // hand-crafted POST from inserting thousands of links.
  const wantedPatterns = [...new Set(patternIds.map((id) => id.trim()))]
    .filter(Boolean)
    .slice(0, 40);
  const wantedTags = [
    ...new Set(
      tagNames.map((name) => name.trim().slice(0, MAX_TAG_LENGTH)).filter(Boolean)
    ),
  ].slice(0, MAX_TAGS);

  const patternIdsToLink = wantedPatterns.length
    ? (
        await db
          .prepare(
            `SELECT id FROM patterns WHERE id IN (${placeholders(wantedPatterns)})`
          )
          .bind(...wantedPatterns)
          .all<{ id: string }>()
      ).results.map((row) => row.id)
    : [];

  const tagIdsToLink = await resolveTagIds(db, wantedTags);

  const statements = [
    db
      .prepare("DELETE FROM problem_patterns WHERE problem_id = ?")
      .bind(problemId),
    db.prepare("DELETE FROM problem_tags WHERE problem_id = ?").bind(problemId),
    ...patternIdsToLink.map((patternId) =>
      db
        .prepare(
          "INSERT OR IGNORE INTO problem_patterns (problem_id, pattern_id) VALUES (?, ?)"
        )
        .bind(problemId, patternId)
    ),
    ...tagIdsToLink.map((tagId) =>
      db
        .prepare(
          "INSERT OR IGNORE INTO problem_tags (problem_id, tag_id) VALUES (?, ?)"
        )
        .bind(problemId, tagId)
    ),
  ];

  if (statements.length) await db.batch(statements);
}

/** Map tag names to ids, creating missing tags. */
async function resolveTagIds(
  db: D1Database,
  names: string[]
): Promise<string[]> {
  const ids: string[] = [];
  const seen = new Set<string>();

  for (const name of names) {
    const slug = slugify(name);
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);

    const existing = await db
      .prepare("SELECT id FROM tags WHERE slug = ? OR name = ?")
      .bind(slug, name)
      .first<{ id: string }>();
    if (existing) {
      ids.push(existing.id);
      continue;
    }

    await db
      .prepare("INSERT OR IGNORE INTO tags (id, name, slug) VALUES (?, ?, ?)")
      .bind(crypto.randomUUID(), name, slug)
      .run();

    const created = await db
      .prepare("SELECT id FROM tags WHERE slug = ? OR name = ?")
      .bind(slug, name)
      .first<{ id: string }>();
    if (created) ids.push(created.id);
  }

  return ids;
}

/** Attach patterns/tags to already-fetched problem rows in two queries. */
async function attachMeta(rows: Problem[]): Promise<ProblemWithMeta[]> {
  if (!rows.length) return [];

  const ids = rows.map((row) => row.id);
  const [patternRows, tagRows] = await Promise.all([
    all<{ problem_id: string; id: string; name: string; slug: string; category: string; description: string | null; mental_model: string | null; common_signals: string | null; created_at: string }>(
      `SELECT pp.problem_id, pat.*
       FROM problem_patterns pp
       JOIN patterns pat ON pat.id = pp.pattern_id
       WHERE pp.problem_id IN (${placeholders(ids)})
       ORDER BY pat.category, pat.name`,
      ...ids
    ),
    all<{ problem_id: string; id: string; name: string; slug: string }>(
      `SELECT pt.problem_id, t.*
       FROM problem_tags pt
       JOIN tags t ON t.id = pt.tag_id
       WHERE pt.problem_id IN (${placeholders(ids)})
       ORDER BY t.name`,
      ...ids
    ),
  ]);

  const patternsByProblem = new Map<string, Pattern[]>();
  for (const row of patternRows) {
    const { problem_id, ...pattern } = row;
    patternsByProblem.set(problem_id, [
      ...(patternsByProblem.get(problem_id) ?? []),
      pattern as Pattern,
    ]);
  }

  const tagsByProblem = new Map<string, Tag[]>();
  for (const row of tagRows) {
    const { problem_id, ...tag } = row;
    tagsByProblem.set(problem_id, [
      ...(tagsByProblem.get(problem_id) ?? []),
      tag as Tag,
    ]);
  }

  return rows.map((problem) => ({
    ...problem,
    patterns: patternsByProblem.get(problem.id) ?? [],
    tags: tagsByProblem.get(problem.id) ?? [],
  }));
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

/**
 * The pattern library query: every pattern with how many problems use it.
 * The optional `category` filter is case-insensitive, like the problem
 * category filter. `LEFT JOIN` keeps patterns with no problems at 0.
 */
export function listPatternsWithCounts(category?: string): Promise<PatternWithCount[]> {
  const filter = category?.trim();
  const where = filter ? "WHERE LOWER(p.category) = ?" : "";

  return all<PatternWithCount>(
    `SELECT p.*, COUNT(pp.problem_id) AS problem_count
     FROM patterns p
     LEFT JOIN problem_patterns pp ON pp.pattern_id = p.id
     ${where}
     GROUP BY p.id
     ORDER BY p.category, p.name`,
    ...(filter ? [filter.toLowerCase()] : [])
  );
}

/** Distinct pattern categories, for the library filter chips. */
export function listPatternCategories(): Promise<string[]> {
  return all<{ category: string }>(
    "SELECT DISTINCT category FROM patterns WHERE category <> '' ORDER BY category COLLATE NOCASE"
  ).then((rows) => rows.map((row) => row.category));
}

export function getPatternBySlug(slug: string): Promise<Pattern | null> {
  return first<Pattern>("SELECT * FROM patterns WHERE slug = ?", slug);
}

/** Problems linked to a pattern, with their own patterns/tags attached. */
export function getPatternProblems(slug: string): Promise<ProblemWithMeta[]> {
  return all<Problem>(
    `SELECT p.*
     FROM problems p
     JOIN problem_patterns pp ON pp.problem_id = p.id
     JOIN patterns pat ON pat.id = pp.pattern_id
     WHERE pat.slug = ?
     ORDER BY p.updated_at DESC, p.title ASC`,
    slug
  ).then((rows) => attachMeta(rows));
}

/** Siblings of a pattern: same category, optionally excluding itself. */
export function listPatternsByCategory(
  category: string,
  excludeSlug?: string,
  limit = 8
): Promise<PatternWithCount[]> {
  const exclude = excludeSlug ? "AND p.slug != ?" : "";

  return all<PatternWithCount>(
    `SELECT p.*, COUNT(pp.problem_id) AS problem_count
     FROM patterns p
     LEFT JOIN problem_patterns pp ON pp.pattern_id = p.id
     WHERE LOWER(p.category) = ? ${exclude}
     GROUP BY p.id
     ORDER BY problem_count DESC, p.name ASC
     LIMIT ?`,
    category.toLowerCase(),
    ...(excludeSlug ? [excludeSlug] : []),
    limit
  );
}

/**
 * Insert a pattern. The slug is derived from the name here, so callers that
 * need it beforehand should slugify the same name and check for a clash.
 */
export async function insertPattern(input: PatternInput): Promise<string> {
  const id = crypto.randomUUID();

  await run(
    `INSERT INTO patterns (id, name, slug, category, description, mental_model, common_signals)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    id,
    input.name,
    slugify(input.name),
    input.category,
    input.description,
    input.mentalModel,
    input.commonSignals
  );

  return id;
}

/** Inline edit of the knowledge page: only the mental model is editable. */
export function updatePatternMentalModel(
  id: string,
  mentalModel: string | null
): Promise<boolean> {
  return run(
    "UPDATE patterns SET mental_model = ? WHERE id = ?",
    mentalModel,
    id
  ).then((result) => result.meta.changes > 0);
}

// ---- tags --------------------------------------------------------

export function listTags(): Promise<Tag[]> {
  return all<Tag>("SELECT * FROM tags ORDER BY name");
}

/** Every tag with how many problems carry it, most used first. */
export function listTagCounts(): Promise<TagWithCount[]> {
  return all<TagWithCount>(
    `SELECT t.*, COUNT(pt.problem_id) AS problem_count
     FROM tags t
     LEFT JOIN problem_tags pt ON pt.tag_id = t.id
     GROUP BY t.id
     ORDER BY problem_count DESC, t.name ASC`
  );
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

// ---- thinking session mutations ----------------------------------

/**
 * Persist a finished thinking session. Timestamps arrive already normalized by
 * the action (`YYYY-MM-DD HH:MM:SS` UTC), so `started_at` keeps sorting the
 * same way as the `datetime('now')` default. Returns the new row id.
 */
export async function insertThinkingSession(
  input: ThinkingSessionInput
): Promise<string> {
  const id = crypto.randomUUID();

  await run(
    `INSERT INTO thinking_sessions
       (id, problem_id, duration_seconds, started_at, ended_at, thoughts)
     VALUES (?, ?, ?, ?, ?, ?)`,
    id,
    input.problemId,
    input.durationSeconds,
    input.startedAt,
    input.endedAt,
    input.thoughts
  );

  return id;
}

/**
 * Delete one session. Scoped to its problem so a hand-crafted id cannot drop
 * a row from another problem.
 */
export function deleteThinkingSession(
  id: string,
  problemId: string
): Promise<boolean> {
  return run(
    "DELETE FROM thinking_sessions WHERE id = ? AND problem_id = ?",
    id,
    problemId
  ).then((result) => result.meta.changes > 0);
}

// ---- notes ------------------------------------------------------

export function listNotes(problemId: string): Promise<Note[]> {
  return all<Note>(
    "SELECT * FROM notes WHERE problem_id = ? ORDER BY created_at DESC",
    problemId
  );
}

/**
 * The knowledge base query: every note with the title of the problem it
 * belongs to. Both filters are optional and combined with AND; an unknown
 * `type` is ignored instead of producing an empty result, and `q` is matched
 * case-insensitively against the note title, its body, and the problem title
 * (with LIKE wildcards escaped, like the problem search).
 */
export function listNotesFiltered(
  filters: NoteFilters = {},
  limit?: number
): Promise<NoteWithProblem[]> {
  const clauses: string[] = [];
  const binds: unknown[] = [];

  const q = filters.q?.trim();
  if (q) {
    const like = `%${q.toLowerCase().replace(/[\\%_]/g, "\\$&")}%`;
    clauses.push(
      "(LOWER(n.title) LIKE ? ESCAPE '\\' OR LOWER(n.content) LIKE ? ESCAPE '\\' OR LOWER(p.title) LIKE ? ESCAPE '\\')"
    );
    binds.push(like, like, like);
  }

  if (filters.type && isNoteType(filters.type)) {
    clauses.push("n.type = ?");
    binds.push(filters.type);
  }

  const where = clauses.length ? `WHERE ${clauses.join("\n   AND ")}` : "";
  const limitClause = limit ? "LIMIT ?" : "";

  return all<NoteWithProblem>(
    `SELECT n.*, p.title AS problem_title
     FROM notes n
     JOIN problems p ON p.id = n.problem_id
     ${where}
     ORDER BY n.updated_at DESC, n.created_at DESC
     ${limitClause}`,
    ...binds,
    ...(limit ? [limit] : [])
  );
}

/** Note counts per type in one pass, for the `/knowledge` header. */
export function countNotesByType(): Promise<NoteTypeCounts> {
  return all<{ type: NoteType; n: number }>(
    "SELECT type, COUNT(*) AS n FROM notes GROUP BY type"
  ).then((rows) => {
    const counts: NoteTypeCounts = {
      mental_model: 0,
      key_lesson: 0,
      mistake: 0,
      general: 0,
    };
    for (const row of rows) {
      if (row.type in counts) counts[row.type] = row.n;
    }
    return counts;
  });
}

/** Insert one note. Returns the new row id. */
export async function insertNote(input: NoteInput): Promise<string> {
  const id = crypto.randomUUID();

  await run(
    `INSERT INTO notes (id, problem_id, title, content, type)
     VALUES (?, ?, ?, ?, ?)`,
    id,
    input.problemId,
    input.title,
    input.content,
    input.type
  );

  return id;
}

/**
 * Update a note in place and bump `updated_at`. Scoped to its problem so a
 * hand-crafted id cannot rewrite a note from another problem.
 */
export function updateNote(
  id: string,
  problemId: string,
  input: Omit<NoteInput, "problemId">
): Promise<boolean> {
  return run(
    `UPDATE notes
     SET type = ?, title = ?, content = ?, updated_at = datetime('now')
     WHERE id = ? AND problem_id = ?`,
    input.type,
    input.title,
    input.content,
    id,
    problemId
  ).then((result) => result.meta.changes > 0);
}

/** Delete one note, scoped to its problem. Returns whether a row changed. */
export function deleteNote(id: string, problemId: string): Promise<boolean> {
  return run(
    "DELETE FROM notes WHERE id = ? AND problem_id = ?",
    id,
    problemId
  ).then((result) => result.meta.changes > 0);
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

/**
 * Persist one final solution. `alternatives` arrives already serialized to JSON
 * by the action. Returns the new row id.
 */
export async function insertSolution(input: SolutionInput): Promise<string> {
  const id = crypto.randomUUID();

  await run(
    `INSERT INTO solutions
       (id, problem_id, language, code, time_complexity, space_complexity,
        explanation, alternatives)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    input.problemId,
    input.language,
    input.code,
    input.timeComplexity,
    input.spaceComplexity,
    input.explanation,
    input.alternatives.length ? JSON.stringify(input.alternatives) : null
  );

  return id;
}

/**
 * Update a solution in place and bump `updated_at`. Scoped to its problem so a
 * hand-crafted id cannot rewrite a solution from another problem.
 */
export function updateSolution(
  id: string,
  problemId: string,
  input: Omit<SolutionInput, "problemId">
): Promise<boolean> {
  return run(
    `UPDATE solutions
     SET language = ?, code = ?, time_complexity = ?, space_complexity = ?,
         explanation = ?, alternatives = ?, updated_at = datetime('now')
     WHERE id = ? AND problem_id = ?`,
    input.language,
    input.code,
    input.timeComplexity,
    input.spaceComplexity,
    input.explanation,
    input.alternatives.length ? JSON.stringify(input.alternatives) : null,
    id,
    problemId
  ).then((result) => result.meta.changes > 0);
}

/** Delete one solution. Scoped to its problem. */
export function deleteSolution(id: string, problemId: string): Promise<boolean> {
  return run(
    "DELETE FROM solutions WHERE id = ? AND problem_id = ?",
    id,
    problemId
  ).then((result) => result.meta.changes > 0);
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

// ---- ai conversation mutations -----------------------------------

/**
 * Persist a pointer to an AI conversation. Only the link is stored — the
 * transcript stays in ChatGPT / AI Studio / Claude, which is the whole point of
 * the feature. Returns the new row id.
 */
export async function insertAiConversation(
  input: AiConversationInput
): Promise<string> {
  const id = crypto.randomUUID();

  await run(
    `INSERT INTO ai_conversations
       (id, problem_id, provider, title, url, description)
     VALUES (?, ?, ?, ?, ?, ?)`,
    id,
    input.problemId,
    input.provider,
    input.title,
    input.url,
    input.description
  );

  return id;
}

/**
 * Delete one conversation link. Scoped to its problem so a hand-crafted id
 * cannot drop a row from another problem.
 */
export function deleteAiConversation(
  id: string,
  problemId: string
): Promise<boolean> {
  return run(
    "DELETE FROM ai_conversations WHERE id = ? AND problem_id = ?",
    id,
    problemId
  ).then((result) => result.meta.changes > 0);
}

// ---- resource mutations -------------------------------------------

/**
 * Attach one external resource (video, article, or plain link) to a problem.
 * `creator` is the who — channel, blog, or community. Returns the new row id.
 */
export async function insertResource(input: ResourceInput): Promise<string> {
  const id = crypto.randomUUID();

  await run(
    `INSERT INTO resources
       (id, problem_id, type, title, url, creator, description, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    input.problemId,
    input.type,
    input.title,
    input.url,
    input.creator,
    input.description,
    input.notes
  );

  return id;
}

/**
 * Update a resource in place. `resources` has no `updated_at` column — the row
 * keeps its original `created_at`, so only the fields change. Scoped to its
 * problem so a hand-crafted id cannot rewrite another problem's resource.
 */
export function updateResource(
  id: string,
  problemId: string,
  input: Omit<ResourceInput, "problemId">
): Promise<boolean> {
  return run(
    `UPDATE resources
     SET type = ?, title = ?, url = ?, creator = ?, description = ?, notes = ?
     WHERE id = ? AND problem_id = ?`,
    input.type,
    input.title,
    input.url,
    input.creator,
    input.description,
    input.notes,
    id,
    problemId
  ).then((result) => result.meta.changes > 0);
}

/** Delete one resource. Scoped to its problem. Returns whether a row changed. */
export function deleteResource(
  id: string,
  problemId: string
): Promise<boolean> {
  return run("DELETE FROM resources WHERE id = ? AND problem_id = ?", id, problemId).then(
    (result) => result.meta.changes > 0
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