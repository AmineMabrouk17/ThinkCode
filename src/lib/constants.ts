import type { Difficulty, ProblemStatus } from "@/types";

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

export const MAX_TITLE_LENGTH = 200;
export const MAX_SHORT_LENGTH = 60;
export const MAX_DESCRIPTION_LENGTH = 5000;
export const MAX_TAGS = 20;
export const MAX_TAG_LENGTH = 40;
export const MAX_MENTAL_MODEL_LENGTH = 2000;
export const MAX_SIGNALS = 20;
export const MAX_SIGNAL_LENGTH = 160;

export function isDifficulty(value: string): value is Difficulty {
  return (DIFFICULTIES as readonly string[]).includes(value);
}

export function isProblemStatus(value: string): value is ProblemStatus {
  return (PROBLEM_STATUSES as readonly string[]).includes(value);
}
