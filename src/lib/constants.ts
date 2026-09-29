import type { Difficulty, NoteType, ProblemStatus } from "@/types";

/**
 * Selectable option lists + labels for the problem library.
 *
 * Kept in `lib` (not `db`) so client components can import them without
 * pulling in the D1 binding.
 */

/** Sentinel used by selects that also accept a free-text value. */
export const CUSTOM_OPTION = "__custom__";

export const DIFFICULTIES: readonly Difficulty[] = ["easy", "medium", "hard"];

export const PROBLEM_STATUSES: readonly ProblemStatus[] = [
  "learning",
  "understood",
  "review",
  "confusing",
  "mastered",
];

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

export const STATUS_LABELS: Record<ProblemStatus, string> = {
  learning: "Learning",
  understood: "Understood",
  review: "Review",
  confusing: "Confusing",
  mastered: "Mastered",
};

/** Platforms offered in the problem form; any other value is free text. */
export const PLATFORM_OPTIONS = ["NeetCode", "LeetCode", "Other"] as const;

/** NeetCode's category list; any other value is free text. */
export const CATEGORY_OPTIONS = [
  "Arrays & Hashing",
  "Two Pointers",
  "Sliding Window",
  "Stack",
  "Binary Search",
  "Linked List",
  "Trees",
  "Tries",
  "Heap",
  "Backtracking",
  "Graphs",
  "Advanced Graphs",
  "1-D DP",
  "2-D DP",
  "Greedy",
  "Intervals",
  "Math & Geometry",
  "Bit Manipulation",
] as const;

export const DEFAULT_PLATFORM = "NeetCode";
export const DEFAULT_CATEGORY = "Arrays & Hashing";
export const DEFAULT_DIFFICULTY: Difficulty = "medium";
export const DEFAULT_STATUS: ProblemStatus = "learning";

// ---- thinking timer ----------------------------------------------

/** Preset session lengths, in minutes, offered by the thinking timer. */
export const THINKING_DURATION_PRESETS = [5, 10, 15, 20, 30] as const;

/** The default session length from the README: 15 minutes. */
export const DEFAULT_THINKING_MINUTES = 15;

export const MIN_THINKING_MINUTES = 1;
export const MAX_THINKING_MINUTES = 180;

/** Shorter sessions are accidental taps, so the server refuses to store them. */
export const MIN_THINKING_SECONDS = 30;

export const MAX_THOUGHTS_LENGTH = 5000;

/** `localStorage` prefix for in-progress thoughts, suffixed with the problem id. */
export const THINKING_DRAFT_PREFIX = "thinkcode:thinking-draft:";

export const MAX_TITLE_LENGTH = 200;
export const MAX_SHORT_LENGTH = 60;
export const MAX_DESCRIPTION_LENGTH = 5000;
export const MAX_TAGS = 20;
export const MAX_TAG_LENGTH = 40;
export const MAX_MENTAL_MODEL_LENGTH = 2000;
export const MAX_SIGNALS = 20;
export const MAX_SIGNAL_LENGTH = 160;

// ---- knowledge notes ----------------------------------------------

/** The four note flavours of the KNOWLEDGE section, in reading order. */
export const NOTE_TYPES: readonly NoteType[] = [
  "mental_model",
  "key_lesson",
  "mistake",
  "general",
];

export const NOTE_TYPE_LABELS: Record<NoteType, string> = {
  mental_model: "Mental model",
  key_lesson: "Key lesson",
  mistake: "Mistake",
  general: "Note",
};

/** Short plurals for the `/knowledge` filter chips. */
export const NOTE_TYPE_PLURALS: Record<NoteType, string> = {
  mental_model: "Mental models",
  key_lesson: "Key lessons",
  mistake: "Mistakes",
  general: "General",
};

export const NOTE_TYPE_EMOJI: Record<NoteType, string> = {
  mental_model: "🧠",
  key_lesson: "💡",
  mistake: "❌",
  general: "📝",
};

/** A note starts as the thing you most want to keep: the mental model. */
export const DEFAULT_NOTE_TYPE: NoteType = "mental_model";

/** Fallback title when the body has no usable first line. */
export const UNTITLED_NOTE_TITLE = "Untitled note";

export const MAX_NOTE_TITLE_LENGTH = 120;
export const MAX_NOTE_CONTENT_LENGTH = 20000;

/** How much of a note the `/knowledge` card shows before the Read toggle. */
export const NOTE_EXCERPT_LENGTH = 180;

// ---- solutions ----------------------------------------------------

/**
 * Languages the solution editor speaks. Kept short and practical: the ones a
 * learner actually writes NeetCode-style solutions in.
 */
export const LANGUAGES = [
  "python",
  "javascript",
  "typescript",
  "java",
  "cpp",
  "c",
  "go",
  "rust",
  "ruby",
  "swift",
  "kotlin",
] as const;

export type SolutionLanguage = (typeof LANGUAGES)[number];

export const LANGUAGE_LABELS: Record<SolutionLanguage, string> = {
  python: "Python",
  javascript: "JavaScript",
  typescript: "TypeScript",
  java: "Java",
  cpp: "C++",
  c: "C",
  go: "Go",
  rust: "Rust",
  ruby: "Ruby",
  swift: "Swift",
  kotlin: "Kotlin",
};

/** The language a new solution starts in. */
export const DEFAULT_SOLUTION_LANGUAGE: SolutionLanguage = "python";

export const MAX_SOLUTION_CODE_LENGTH = 20000;
export const MAX_SOLUTION_EXPLANATION_LENGTH = 10000;
export const MAX_COMPLEXITY_LENGTH = 40;
export const MAX_ALTERNATIVE_LABEL_LENGTH = 80;
export const MAX_ALTERNATIVE_CODE_LENGTH = 20000;

/** Alternatives are a short list of "other ways I could write this". */
export const MAX_SOLUTION_ALTERNATIVES = 5;

export function isLanguage(value: string): value is SolutionLanguage {
  return (LANGUAGES as readonly string[]).includes(value);
}

export function isDifficulty(value: string): value is Difficulty {
  return (DIFFICULTIES as readonly string[]).includes(value);
}

export function isProblemStatus(value: string): value is ProblemStatus {
  return (PROBLEM_STATUSES as readonly string[]).includes(value);
}

export function isNoteType(value: string): value is NoteType {
  return (NOTE_TYPES as readonly string[]).includes(value);
}
