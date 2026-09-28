import type { Difficulty } from "@/types";

import { Badge } from "@/components/ui/badge";

type DifficultyStyle = {
  label: string;
  className: string;
};

const DIFFICULTY_STYLES: Record<Difficulty, DifficultyStyle> = {
  easy: { label: "Easy", className: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300" },
  medium: { label: "Medium", className: "border-amber-400/30 bg-amber-400/10 text-amber-300" },
  hard: { label: "Hard", className: "border-rose-400/30 bg-rose-400/10 text-rose-300" },
};

export function DifficultyBadge({
  difficulty,
  className,
}: {
  difficulty: Difficulty;
  className?: string;
}) {
  const style = DIFFICULTY_STYLES[difficulty];
  return (
    <Badge className={className} aria-label={`Difficulty: ${style.label}`}>
      {style.label}
    </Badge>
  );
}