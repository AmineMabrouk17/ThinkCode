import { cn } from "@/lib/utils";

export function Spinner({
  className,
  label = "Loading",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn("inline-flex items-center gap-2", className)}
    >
      <svg
        className="h-4 w-4 animate-spin text-accent"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden
      >
        <circle
          className="opacity-20"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-90"
          fill="currentColor"
          d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z"
        />
      </svg>
      <span className="text-sm text-muted">{label}</span>
    </span>
  );
}