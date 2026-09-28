import type { ProblemStatus } from "@/types";

import { Badge } from "@/components/ui/badge";

type StatusStyle = {
  label: string;
  emoji: string;
  className: string;
};

const STATUS_STYLES: Record<ProblemStatus, StatusStyle> = {
  learning: {
    label: "Learning",
    emoji: "🟡",
    className: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  },
  understood: {
    label: "Understood",
    emoji: "🟢",
    className: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  },
  review: {
    label: "Review",
    emoji: "🔵",
    className: "border-sky-400/30 bg-sky-400/10 text-sky-300",
  },
  confusing: {
    label: "Confusing",
    emoji: "🔴",
    className: "border-rose-400/30 bg-rose-400/10 text-rose-300",
  },
  mastered: {
    label: "Mastered",
    emoji: "⭐",
    className: "border-violet-400/30 bg-violet-400/10 text-violet-300",
  },
};

export function StatusBadge({
  status,
  className,
}: {
  status: ProblemStatus;
  className?: string;
}) {
  const style = STATUS_STYLES[status];
  return (
    <Badge className={className} aria-label={`Status: ${style.label}`}>
      <span aria-hidden>{style.emoji}</span>
      {style.label}
    </Badge>
  );
}