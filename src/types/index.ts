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
  /** Overrides the parent solution's language when set. */
  language?: string;
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
  /** Who made it (channel, blog, community) — the README's `Creator` field. */
  creator: string | null;
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

/** A full note joined with the title of the problem it belongs to. */
export interface NoteWithProblem extends Note {
  problem_title: string;
}

/** Note counts per type, from a single `GROUP BY type` query. */
export type NoteTypeCounts = Record<NoteType, number>;

/** A pattern with the number of problems linked through `problem_patterns`. */
export interface PatternWithCount extends Pattern {
  problem_count: number;
}

/** A tag with the number of problems linked through `problem_tags`. */
export interface TagWithCount extends Tag {
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

// ---- thinking ---------------------------------------------------

/** Validated payload for a finished thinking session. */
export interface ThinkingSessionInput {
  problemId: string;
  /** At least `MIN_THINKING_SECONDS`; enforced by the server action. */
  durationSeconds: number;
  /** `YYYY-MM-DD HH:MM:SS` UTC, the shape D1 stores. */
  startedAt: string;
  endedAt: string | null;
  thoughts: string | null;
}

/** Result of `saveThinkingSession`, consumed by `useActionState`. */
export interface ThinkingSessionFormState {
  status: "idle" | "error" | "success";
  /** General (non field-specific) message. */
  message?: string;
  /** Set once the session exists, so the client can close the modal. */
  sessionId?: string;
}

// ---- pattern library --------------------------------------------

/** Validated, normalized pattern payload for creation. */
export interface PatternInput {
  name: string;
  category: string;
  description: string | null;
  mentalModel: string | null;
  /** Newline-separated list of signals. */
  commonSignals: string | null;
}

/** Form fields of the pattern form that can carry a validation error. */
export type PatternField =
  | "name"
  | "category"
  | "description"
  | "mentalModel"
  | "commonSignals";

/** Result of `createPattern`, consumed by `useActionState`. */
export interface PatternFormState {
  status: "idle" | "error" | "success";
  /** General (non field-specific) message. */
  message?: string;
  fieldErrors?: Partial<Record<PatternField, string>>;
  /** Set once the pattern exists, so the form can open its page. */
  slug?: string;
}

/** Result of `updatePatternMentalModel`, consumed by `useActionState`. */
export interface MentalModelFormState {
  status: "idle" | "error" | "success";
  message?: string;
}

// ---- knowledge notes ---------------------------------------------

/**
 * Filters for the knowledge base. They map 1:1 to the URL search params of
 * `/knowledge` (`?q=&type=`), which keeps every view shareable and
 * server-rendered.
 */
export interface NoteFilters {
  /** Free text, matched against note title + content + problem title. */
  q?: string;
  type?: NoteType;
}

/** Validated, normalized note payload for create/update. */
export interface NoteInput {
  problemId: string;
  type: NoteType;
  title: string;
  content: string;
}

/** Form fields of the note form that can carry a validation error. */
export type NoteField = "type" | "title" | "content";

/** Result of `createNote` / `updateNoteAction`, consumed by `useActionState`. */
export interface NoteFormState {
  status: "idle" | "error" | "success";
  /** General (non field-specific) message. */
  message?: string;
  fieldErrors?: Partial<Record<NoteField, string>>;
  /** Set once the note exists, so the modal can close. */
  noteId?: string;
}

// ---- solutions ---------------------------------------------------

/** Validated, normalized solution payload for create/update. */
export interface SolutionInput {
  problemId: string;
  language: string;
  code: string;
  timeComplexity: string | null;
  spaceComplexity: string | null;
  explanation: string | null;
  /** Stored as a JSON array string; `[]` means "no alternatives". */
  alternatives: SolutionAlternative[];
}

/** Form fields of the solution form that can carry a validation error. */
export type SolutionField =
  | "language"
  | "code"
  | "timeComplexity"
  | "spaceComplexity"
  | "explanation"
  | "alternatives";

/** Result of `createSolution` / `updateSolutionAction`, consumed by `useActionState`. */
export interface SolutionFormState {
  status: "idle" | "error" | "success";
  /** General (non field-specific) message. */
  message?: string;
  fieldErrors?: Partial<Record<SolutionField, string>>;
  /** Set once the solution exists, so the modal can close. */
  solutionId?: string;
}

// ---- visualizations ----------------------------------------------

/**
 * Validated payload for one visualization.
 *
 * The three kinds share one `content` column, so what it holds depends on
 * `type`: Mermaid source, plain-text/ASCII art, or an absolute `http(s)` image
 * URL. An image is a *link* — ThinkCode has no upload or file storage, so the
 * picture stays wherever it was drawn and only the pointer is kept.
 */
export interface VisualizationInput {
  problemId: string;
  title: string;
  type: VisualizationType;
  content: string;
}

/** Form fields of the visualization form that can carry a validation error. */
export type VisualizationField = "type" | "title" | "content";

/** Result of `createVisualization` / `updateVisualizationAction`, consumed by `useActionState`. */
export interface VisualizationFormState {
  status: "idle" | "error" | "success";
  /** General (non field-specific) message. */
  message?: string;
  fieldErrors?: Partial<Record<VisualizationField, string>>;
  /** Set once the visualization exists, so the modal can close. */
  visualizationId?: string;
}

// ---- AI conversations & resources --------------------------------

/**
 * Validated payload for one saved AI conversation.
 *
 * Only the link is stored: ThinkCode never mirrors the conversation itself, so
 * the row is a pointer (provider + url) plus the personal reason for keeping it.
 */
export interface AiConversationInput {
  problemId: string;
  provider: AiProvider;
  title: string;
  url: string;
  description: string | null;
}

/** Form fields of the AI conversation form that can carry a validation error. */
export type AiConversationField = "provider" | "title" | "url" | "description";

/** Result of `createAiConversation`, consumed by `useActionState`. */
export interface AiConversationFormState {
  status: "idle" | "error" | "success";
  /** General (non field-specific) message. */
  message?: string;
  fieldErrors?: Partial<Record<AiConversationField, string>>;
  /** Set once the conversation exists, so the modal can close. */
  conversationId?: string;
}

/** Validated payload for one external resource (video, article, or link). */
export interface ResourceInput {
  problemId: string;
  type: ResourceType;
  title: string;
  url: string;
  creator: string | null;
  description: string | null;
  /** The personal "Why I saved it" note. */
  notes: string | null;
}

/** Form fields of the resource form that can carry a validation error. */
export type ResourceField =
  | "type"
  | "title"
  | "url"
  | "creator"
  | "description"
  | "notes";

/** Result of `createResource` / `updateResourceAction`, consumed by `useActionState`. */
export interface ResourceFormState {
  status: "idle" | "error" | "success";
  /** General (non field-specific) message. */
  message?: string;
  fieldErrors?: Partial<Record<ResourceField, string>>;
  /** Set once the resource exists, so the modal can close. */
  resourceId?: string;
}
