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