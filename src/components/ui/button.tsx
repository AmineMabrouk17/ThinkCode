import { forwardRef } from "react";

import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "ghost" | "outline" | "danger" | "success";
type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = React.ComponentPropsWithoutRef<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-sm shadow-indigo-950/40 hover:from-indigo-400 hover:to-violet-400 active:from-indigo-500 active:to-violet-500",
  ghost:
    "bg-transparent text-muted hover:bg-surface-2 hover:text-ink",
  outline:
    "border border-border bg-transparent text-ink hover:bg-surface-2",
  danger:
    "border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20",
  success:
    "border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-6 text-sm",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition-colors duration-150",
        "disabled:pointer-events-none disabled:opacity-50",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    />
  )
);
Button.displayName = "Button";