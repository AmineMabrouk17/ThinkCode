import { forwardRef } from "react";

import { cn } from "@/lib/utils";

export type TextareaProps = React.ComponentPropsWithoutRef<"textarea">;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "min-h-24 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink",
        "placeholder:text-muted/70",
        "focus:border-accent/60 focus:outline-none focus:ring-2 focus:ring-accent/25",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";