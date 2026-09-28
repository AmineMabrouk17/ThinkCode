import { forwardRef } from "react";

import { cn } from "@/lib/utils";

export type InputProps = React.ComponentPropsWithoutRef<"input">;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-ink",
        "placeholder:text-muted/70",
        "focus:border-accent/60 focus:outline-none focus:ring-2 focus:ring-accent/25",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";