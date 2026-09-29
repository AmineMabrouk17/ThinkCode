import type { VisualizationType } from "@/types";

/**
 * Starter snippets for the UNDERSTAND section.
 *
 * The blank editor is the part of a diagram tool that stalls people: you know
 * *what* you want to draw, not how to start the Mermaid grammar. Each template
 * is a small, working diagram you can insert with one click and then edit into
 * your own problem — the point is never to stare at an empty box.
 *
 * Kept in `lib` (not in the components) so the client form can import them
 * without pulling anything server-only along.
 */

export type VisualizationTemplate = {
  id: string;
  /** Button text. */
  label: string;
  /** One line telling you when this shape is the right one to reach for. */
  hint: string;
  /** Which visualization type the snippet is valid for. */
  type: VisualizationType;
  code: string;
};

/** Ready-to-insert Mermaid sources. */
export const MERMAID_TEMPLATES: readonly VisualizationTemplate[] = [
  {
    id: "complement-lookup",
    label: "Complement lookup",
    hint: "One box per step of “fix a number, check the map”.",
    type: "mermaid",
    code: `flowchart TD
  A["Fix one number: current = 2"] --> B["complement = target - current = 7"]
  B --> C{"Has 7 been seen?"}
  C -- "no" --> D["Remember 2 at index 0"]
  C -- "yes" --> E["Return the two indices"]`,
  },
  {
    id: "two-pointer-walk",
    label: "Two-pointer walk",
    hint: "Left and right moving toward each other, one comparison per step.",
    type: "mermaid",
    code: `flowchart LR
  L["left = 0"] --> S["sum = nums[left] + nums[right]"]
  R["right = n - 1"] --> S
  S --> C{"sum vs target"}
  C -- "too big" --> R2["right -= 1"]
  C -- "too small" --> L2["left += 1"]
  R2 --> S
  L2 --> S
  C -- "equal" --> F["Found"]`,
  },
  {
    id: "state-machine",
    label: "State machine",
    hint: "For “which state is the algorithm in right now?” thinking.",
    type: "mermaid",
    code: `stateDiagram-v2
  [*] --> Empty
  Empty --> Scanning: first element
  Scanning --> Found: match
  Scanning --> Scanning: keep scanning
  Scanning --> Done: end of input
  Found --> [*]
  Done --> [*]`,
  },
  {
    id: "complexity-table",
    label: "Cost table",
    hint: "Time and space per step, so the O() is not a memory.",
    type: "mermaid",
    code: `flowchart LR
  subgraph Time
    T1["1 pass — O(n)"]
    T2["2 passes — O(2n)"]
  end
  subgraph Space
    S1["no extra memory — O(1)"]
    S2["hash map — O(n)"]
  end
  T1 --> S1
  T2 --> S2`,
  },
];

/** Ready-to-insert ASCII starters, for the `diagram` type. */
export const DIAGRAM_TEMPLATES: readonly VisualizationTemplate[] = [
  {
    id: "complement-ascii",
    label: "Complement walk",
    hint: "The README's own sketch, ready to paste.",
    type: "diagram",
    code: `nums = [2, 7, 11, 15]
target = 9

          2
          │
          ▼
    complement = 7
          │
          ▼
   ┌──────────────┐
   │ Seen values  │
   │              │
   │      2       │
   └──────────────┘
          │
          ▼
        found`,
  },
  {
    id: "table-ascii",
    label: "Trace table",
    hint: "One row per step, for algorithms you cannot picture.",
    type: "diagram",
    code: `step  left  right  sum  action
  1     0      4      9   equal → done`,
  },
];

/** The snippets that apply to a given type, Mermaid first. */
export function templatesForType(type: VisualizationType): readonly VisualizationTemplate[] {
  return type === "diagram" ? DIAGRAM_TEMPLATES : MERMAID_TEMPLATES;
}
