/**
 * ThinkCode domain types.
 *
 * All rows use TEXT ids generated with `crypto.randomUUID()`.
 * These interfaces mirror the D1 schema in `migrations/0001_init.sql`.
 */

export type Difficulty = "easy" | "medium" | "hard";

export type ProblemStatus =
  | "learning"
  | "understood"
  | "review"
  | "confusing"
  | "mastered";

export type NoteType = "mental_model" | "key_lesson" | "mistake" | "general";

export type AiProvider = "ChatGPT" | "AI Studio" | "Claude" | "Other";

export type ResourceType = "youtube" | "article" | "other";

export type VisualizationType = "mermaid" | "image" | "diagram";

/** A JSON array string like `[{"label":"...","code":"..."}]`. */
export type SolutionAlternative = {
  label: string;
  code: string;
};

export interface Problem {
  id: string;
  title: string;
  platform: string;
  external_url: string | null;
  difficulty: Difficulty;
  category: string;
  status: ProblemStatus;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Pattern {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string | null;
  mental_model: string | null;
  /** Newline-separated list of signals. */
  common_signals: string | null;
  created_at: string;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
}

export interface ThinkingSession {
  id: string;
  problem_id: string;
  duration_seconds: number;
  started_at: string;
  ended_at: string | null;
  thoughts: string | null;
}

export interface AiConversation {
  id: string;
  problem_id: string;
  provider: AiProvider;
  title: string;
  url: string;
  description: string | null;
  created_at: string;
}

export interface Resource {
  id: string;
  problem_id: string;
  type: ResourceType;
  title: string;
  url: string;
  description: string | null;
  notes: string | null;
  created_at: string;
}

export interface Visualization {
  id: string;
  problem_id: string;
  title: string;
  type: VisualizationType;
  content: string;
  created_at: string;
}

export interface Note {
  id: string;
  problem_id: string;
  title: string;
  content: string;
  type: NoteType;
  created_at: string;
  updated_at: string;
}

export interface Solution {
  id: string;
  problem_id: string;
  language: string;
  code: string;
  time_complexity: string | null;
  space_complexity: string | null;
  explanation: string | null;
  /** JSON array string of alternatives. */
  alternatives: string | null;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  problem_id: string;
  thoughts: string | null;
  confidence: number | null;
  elapsed_days: number | null;
  reviewed_at: string;
  next_review_at: string | null;
}

/** Problem counts per status, from a single `GROUP BY status` query. */
export type ProblemStatusCounts = Record<ProblemStatus, number>;

/** A problem flagged for review, or with an overdue review schedule. */
export interface ReviewDueProblem {
  id: string;
  title: string;
  category: string;
  difficulty: Difficulty;
  status: ProblemStatus;
  /** Most recent `reviews.reviewed_at` for the problem, if any. */
  last_reviewed_at: string | null;
  /** Whole days since `last_reviewed_at`, null when never reviewed. */
  days_since_review: number | null;
  /** Earliest overdue `reviews.next_review_at`, null when only the status is due. */
  due_at: string | null;
}

/** A note joined with the title of the problem it belongs to. */
export interface RecentNote {
  id: string;
  problem_id: string;
  title: string;
  type: NoteType;
  created_at: string;
  problem_title: string;
}

/** A pattern with the number of problems linked through `problem_patterns`. */
export interface PatternWithCount extends Pattern {
  problem_count: number;
}

/** Everything the dashboard renders, fetched in one pass. */
export interface DashboardData {
  /** Total problems = sum of `counts`. */
  total: number;
  counts: ProblemStatusCounts;
  /** Problems that are not mastered yet, most recently updated first. */
  continueLearning: Problem[];
  needsReview: ReviewDueProblem[];
  recentNotes: RecentNote[];
  topPatterns: PatternWithCount[];
}

// ---- problem library --------------------------------------------

/** A problem plus the patterns and tags linked through the join tables. */
export interface ProblemWithMeta extends Problem {
  patterns: Pattern[];
  tags: Tag[];
}

/**
 * Filters for the problem library. They map 1:1 to the URL search params of
 * `/problems` (`?q=&platform=&difficulty=&category=&pattern=&status=&tag=`),
 * which keeps every view shareable and server-rendered.
 */
export interface ProblemFilters {
  /** Free text, matched against title + description. */
  q?: string;
  platform?: string;
  difficulty?: Difficulty;
  category?: string;
  /** Pattern **slug**. */
  pattern?: string;
  status?: ProblemStatus;
  /** Tag **slug**. */
  tag?: string;
}

/** Validated, normalized problem payload for create/update. */
export interface ProblemInput {
  title: string;
  platform: string;
  externalUrl: string | null;
  difficulty: Difficulty;
  category: string;
  status: ProblemStatus;
  description: string | null;
  /** Existing pattern ids. Unknown ids are ignored when linking. */
  patternIds: string[];
  /** Tag names — existing ones are reused, new ones are created on the fly. */
  tags: string[];
}

/** The per-problem records rendered as the read-only section lists. */
export interface ProblemRecords {
  sessions: ThinkingSession[];
  aiConversations: AiConversation[];
  resources: Resource[];
  visualizations: Visualization[];
  notes: Note[];
  solutions: Solution[];
  reviews: Review[];
}

/** Form fields that can carry a validation error. */
export type ProblemField =
  | "title"
  | "platform"
  | "externalUrl"
  | "difficulty"
  | "category"
  | "status"
  | "description"
  | "tags";

/** Result of the create/update form actions, consumed by `useActionState`. */
export interface ProblemFormState {
  status: "idle" | "error" | "success";
  /** General (non field-specific) message. */
  message?: string;
  fieldErrors?: Partial<Record<ProblemField, string>>;
  /** Set once the problem exists, so the form can navigate to it. */
  problemId?: string;
}