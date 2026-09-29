"use client";

import { useState } from "react";

import { MAX_VISUALIZATION_CONTENT_LENGTH } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { MermaidDiagram } from "@/components/visualizations/mermaid-diagram";
import { Textarea } from "@/components/ui/textarea";

/**
 * A calm Mermaid editor: a monospace textarea with a Write/Preview toggle.
 *
 * Same shape as the knowledge `MarkdownEditor`, one grammar lighter — there is
 * no formatting toolbar because Mermaid's grammar *is* the toolbar: the node
 * shapes, the arrows, the subgraphs. The preview goes through the exact same
 * {@link MermaidDiagram} the saved card uses, so what you see while writing is
 * what you get afterwards, error card included.
 *
 * Controlled, so the surrounding form owns the value and resets it when a save
 * lands.
 */
export function MermaidEditor({
  id,
  name = "content",
  value,
  onChange,
  error,
  placeholder = "flowchart TD\n  A[Fix one number] --> B[Complement]",
  maxLength = MAX_VISUALIZATION_CONTENT_LENGTH,
}: {
  id?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  /** Validation message from the server action, shown under the editor. */
  error?: string;
  placeholder?: string;
  maxLength?: number;
}) {
  const [mode, setMode] = useState<"write" | "preview">("write");

  const over = value.length > maxLength;
  const counterClass = cn(
    "text-xs tabular-nums",
    over
      ? "text-rose-400"
      : value.length > maxLength * 0.9
        ? "text-amber-300"
        : "text-muted/80"
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <div
          role="group"
          aria-label="Diagram mode"
          className="flex items-center gap-0.5 rounded-lg border border-border bg-surface-2 p-0.5"
        >
          {(["write", "preview"] as const).map((value_) => (
            <button
              key={value_}
              type="button"
              onClick={() => setMode(value_)}
              aria-pressed={mode === value_}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors",
                mode === value_
                  ? "bg-accent/20 text-ink"
                  : "text-muted hover:text-ink"
              )}
            >
              {value_}
            </button>
          ))}
        </div>
      </div>

      <input type="hidden" name={name} value={value} />

      {mode === "write" ? (
        <Textarea
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          maxLength={maxLength}
          rows={8}
          placeholder={placeholder}
          spellCheck={false}
          aria-label="Mermaid source"
          aria-invalid={error ? true : undefined}
          className="resize-y font-mono leading-relaxed"
        />
      ) : (
        <MermaidDiagram code={value} label="Preview" className="min-h-48" />
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted/70">
          Mermaid supported — <code className="font-mono">flowchart TD</code>,{" "}
          <code className="font-mono">{"A[x] --&gt; B"}</code>,{" "}
          <code className="font-mono">{"A{\"?\"}"}</code> decisions, subgraphs.
        </p>
        <p className={counterClass} aria-live="polite">
          {value.length} / {maxLength}
        </p>
      </div>

      {error ? (
        <p role="alert" className="text-xs text-rose-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}
