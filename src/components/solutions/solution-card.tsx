"use client";

import { useState, useTransition } from "react";

import { deleteSolutionAction } from "@/app/problems/solution-actions";
import { Markdown } from "@/components/knowledge/markdown";
import { SolutionForm } from "@/components/solutions/solution-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Spinner } from "@/components/ui/spinner";
import { formatDate } from "@/lib/utils";
import { codeFence, languageLabel, parseAlternatives } from "@/lib/solution-utils";
import type { Solution } from "@/types";

/**
 * One stored solution: its language, highlighted code, complexity badges, the
 * explanation, and any alternative implementations.
 *
 * Highlighting comes for free by handing the code to the shared markdown
 * renderer inside a fenced block — the same pipeline the notes use.
 */
export function SolutionCard({
  problemId,
  solution,
}: {
  problemId: string;
  solution: Solution;
}) {
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const alternatives = parseAlternatives(solution.alternatives);
  const [openAlternatives, setOpenAlternatives] = useState<string[]>([]);

  function remove() {
    setError(null);
    startTransition(async () => {
      const result = await deleteSolutionAction(problemId, solution.id);
      if (result.ok) setConfirming(false);
      else setError(result.error ?? "Could not delete this solution.");
    });
  }

  function toggleAlternative(key: string) {
    setOpenAlternatives((open) =>
      open.includes(key) ? open.filter((value) => value !== key) : [...open, key]
    );
  }

  return (
    <>
      <Card className="transition-colors hover:border-accent/40">
        <CardContent className="flex flex-col gap-3 py-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="font-mono" aria-label={`Language: ${languageLabel(solution.language)}`}>
                {solution.language}
              </Badge>
              {solution.time_complexity ? (
                <Badge
                  variant="subtle"
                  className="font-mono tabular-nums"
                  aria-label={`Time complexity ${solution.time_complexity}`}
                >
                  ⏱ {solution.time_complexity}
                </Badge>
              ) : null}
              {solution.space_complexity ? (
                <Badge
                  variant="subtle"
                  className="font-mono tabular-nums"
                  aria-label={`Space complexity ${solution.space_complexity}`}
                >
                  🧠 {solution.space_complexity}
                </Badge>
              ) : null}
              <span className="text-xs text-muted/80">
                Updated {formatDate(solution.updated_at)}
              </span>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              <CopyButton code={solution.code} />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditing(true)}
                aria-label={`Edit the ${solution.language} solution`}
              >
                <span aria-hidden>✏️</span> Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirming(true)}
                aria-label={`Delete the ${solution.language} solution`}
                className="px-2 text-muted hover:text-rose-400"
              >
                <span aria-hidden>🗑</span>
              </Button>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-border">
            <Markdown content={codeFence(solution.code, solution.language)} />
          </div>

          {solution.explanation ? (
            <div className="rounded-lg border border-border bg-surface-2 px-4 py-3">
              <Markdown content={solution.explanation} />
            </div>
          ) : null}

          {alternatives.length ? (
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-widest text-muted">
                Alternatives
              </span>
              {alternatives.map((alternative, index) => {
                const key = `${solution.id}-alt-${index}`;
                const open = openAlternatives.includes(key);
                const language = alternative.language ?? solution.language;
                return (
                  <div
                    key={key}
                    className="rounded-lg border border-border bg-surface-2/40"
                  >
                    <button
                      type="button"
                      onClick={() => toggleAlternative(key)}
                      aria-expanded={open}
                      aria-controls={`${key}-body`}
                      className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm text-ink"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="truncate">{alternative.label}</span>
                        <span className="shrink-0 font-mono text-xs text-muted">
                          {language}
                        </span>
                      </span>
                      <span aria-hidden className="text-xs text-muted">
                        {open ? "Hide" : "Show"}
                      </span>
                    </button>
                    {open ? (
                      <div id={`${key}-body`} className="border-t border-border">
                        <Markdown
                          content={codeFence(alternative.code, language)}
                          className="m-0"
                        />
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Modal
        open={editing}
        onClose={() => setEditing(false)}
        title={`Edit — ${languageLabel(solution.language)} solution`}
        className="max-h-[85vh] max-w-3xl overflow-y-auto"
      >
        <SolutionForm
          problemId={problemId}
          mode="edit"
          solution={solution}
          onSuccess={() => setEditing(false)}
        />
      </Modal>

      <Modal open={confirming} onClose={() => setConfirming(false)} title="Delete solution">
        <div className="flex flex-col gap-4">
          <p className="text-sm leading-relaxed text-muted">
            This deletes the{" "}
            <span className="font-mono text-ink">{solution.language}</span> solution
            and its alternatives. Your thinking sessions and notes are untouched. It
            cannot be undone.
          </p>
          {error ? (
            <p role="alert" className="text-xs text-rose-400">
              {error}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center justify-end gap-2">
            {pending ? <Spinner label="Deleting…" /> : null}
            <Button variant="ghost" onClick={() => setConfirming(false)} disabled={pending}>
              Keep it
            </Button>
            <Button variant="danger" onClick={remove} disabled={pending}>
              Delete solution
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

/** Copy the code to the clipboard with a brief confirmation. */
function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  function copy() {
    startTransition(async () => {
      try {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        setCopied(false);
      }
    });
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={copy}
      disabled={pending}
      aria-label="Copy solution code"
    >
      <span aria-hidden>⧉</span> {copied ? "Copied ✓" : "Copy"}
    </Button>
  );
}
