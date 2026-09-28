import { cn } from "@/lib/utils";

type BadgeVariant = "neutral" | "accent" | "subtle";

export type BadgeProps = React.ComponentPropsWithoutRef<"span"> & {
  variant?: BadgeVariant;
};

const variantClasses: Record<BadgeVariant, string> = {
  neutral:
    "border-border bg-surface-2 text-ink",
  accent:
    "border-accent/30 bg-accent/10 text-indigo-300",
  subtle:
    "border-transparent bg-surface-2 text-muted",
};

export function Badge({ className, variant = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}