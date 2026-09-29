import { Badge } from "@/components/ui/badge";
import {
  NOTE_TYPE_EMOJI,
  NOTE_TYPE_LABELS,
} from "@/lib/constants";
import type { NoteType } from "@/types";

/**
 * The type badge of a note: 🧠 mental model, 💡 key lesson, ❌ mistake, 📝
 * general. Each flavour keeps its own colour so the four are distinguishable
 * at a glance without reading the label.
 */
const badgeClass: Record<NoteType, string> = {
  mental_model: "border-indigo-500/30 bg-indigo-500/10 text-indigo-200",
  key_lesson: "border-amber-500/30 bg-amber-500/10 text-amber-200",
  mistake: "border-rose-500/30 bg-rose-500/10 text-rose-200",
  general: "border-border bg-surface-2 text-muted",
};

export function NoteTypeBadge({ type }: { type: NoteType }) {
  return (
    <Badge className={badgeClass[type]} aria-label={`Type: ${NOTE_TYPE_LABELS[type]}`}>
      <span aria-hidden>{NOTE_TYPE_EMOJI[type]}</span>
      {NOTE_TYPE_LABELS[type]}
    </Badge>
  );
}
