"use client";

import { useRef, useState } from "react";

import { MAX_NOTE_CONTENT_LENGTH } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Markdown } from "@/components/knowledge/markdown";
import { Textarea } from "@/components/ui/textarea";

/**
 * A calm markdown editor: a monospace textarea with a tiny formatting toolbar
 * and a Write/Preview toggle. Controlled, so the surrounding form owns the
 * value and can reset it when a save lands.
 *
 * The preview renders through the same {@link Markdown} component the read
 * views use, so what you see while writing is what you get later.
 */
export function MarkdownEditor({
  id,
  name = "content",
  value,
  onChange,
  error,
  placeholder = "Fix one number, compute the complement, check whether it was already seen…",
  maxLength = MAX_NOTE_CONTENT_LENGTH,
  minHeightClass = "min-h-72",
}: {
  id?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  /** Validation message from the server action, shown under the editor. */
  error?: string;
  placeholder?: string;
  maxLength?: number;
  minHeightClass?: string;
}) {
  const [mode, setMode] = useState<"write" | "preview">("write");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /** Replace the current selection, then put the caret back where it belongs. */
  function replaceSelection(before: string, after: string, fallback: string) {
    const textarea = textareaRef.current;
    const start = textarea?.selectionStart ?? value.length;
    const end = textarea?.selectionEnd ?? value.length;
    const selected = value.slice(start, end) || fallback;
    const next = `${value.slice(0, start)}${before}${selected}${after}${value.slice(end)}`;

    onChange(next);

    // The textarea is controlled, so the DOM value is still the old one when
    // this runs. Restore the caret after React commits the new value.
    requestAnimationFrame(() => {
      const node = textareaRef.current;
      if (!node) return;
      const caret = start + before.length + selected.length;
      node.focus();
      node.setSelectionRange(caret, caret);
    });
  }

  /** Prefix every touched line, for the code block. */
  function prefixLines(prefix: string) {
    const textarea = textareaRef.current;
    const start = textarea?.selectionStart ?? value.length;
    const end = textarea?.selectionEnd ?? value.length;

    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const lineEndIndex = value.indexOf("\n", end);
    const lineEnd = lineEndIndex === -1 ? value.length : lineEndIndex;

    const block = value.slice(lineStart, lineEnd) || "";
    const prefixed = block
      .split("\n")
      .map((line) => `${prefix}${line}`)
      .join("\n");

    onChange(`${value.slice(0, lineStart)}${prefixed}${value.slice(lineEnd)}`);

    requestAnimationFrame(() => {
      const node = textareaRef.current;
      if (!node) return;
      node.focus();
      node.setSelectionRange(start + prefix.length, lineEnd + prefix.length * block.split("\n").length);
    });
  }

  const over = value.length > maxLength;
  const counterClass = cn(
    "text-xs tabular-nums",
    over ? "text-rose-400" : value.length > maxLength * 0.9 ? "text-amber-300" : "text-muted/80"
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div
          role="group"
          aria-label="Markdown formatting"
          className="flex flex-wrap items-center gap-1"
        >
          <ToolbarButton label="Bold" onClick={() => replaceSelection("**", "**", "bold text")}>
            <span aria-hidden className="font-bold">
              B
            </span>
          </ToolbarButton>
          <ToolbarButton
            label="Italic"
            onClick={() => replaceSelection("_", "_", "italic text")}
          >
            <span aria-hidden className="font-mono italic">
              I
            </span>
          </ToolbarButton>
          <ToolbarButton
            label="Inline code"
            onClick={() => replaceSelection("`", "`", "code")}
          >
            <span aria-hidden className="font-mono text-xs">
              {"</>"}
            </span>
          </ToolbarButton>
          <ToolbarButton label="Code block" onClick={() => prefixLines("```\n")}>
            <span aria-hidden className="font-mono text-xs">
              {"{ }"}
            </span>
          </ToolbarButton>
          <ToolbarButton label="Bullet list" onClick={() => prefixLines("- ")}>
            <span aria-hidden>•</span>
          </ToolbarButton>
        </div>

        <div
          role="group"
          aria-label="Editor mode"
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
          ref={textareaRef}
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          maxLength={maxLength}
          placeholder={placeholder}
          spellCheck
          aria-label="Note content, markdown"
          aria-invalid={error ? true : undefined}
          className={cn(
            "font-mono leading-relaxed",
            "resize-y",
            minHeightClass
          )}
        />
      ) : (
        <div
          className={cn(
            "overflow-x-auto rounded-lg border border-border bg-surface px-4 py-3",
            minHeightClass
          )}
        >
          {value.trim() ? (
            <Markdown content={value} />
          ) : (
            <p className="text-sm text-muted/70">
              Nothing to preview yet — switch back to Write and start typing.
            </p>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted/70">
          Markdown supported — <code className="font-mono">#</code>,{" "}
          <code className="font-mono">-</code>,{" "}
          <code className="font-mono">**bold**</code>,{" "}
          <code className="font-mono">`code`</code>, fenced code blocks.
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

function ToolbarButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex h-7 min-w-7 items-center justify-center rounded-md border border-border bg-surface px-1.5 text-xs text-muted transition-colors hover:bg-surface-2 hover:text-ink"
    >
      {children}
    </button>
  );
}
