"use client";

import dynamic from "next/dynamic";
import { Suspense, use } from "react";
import type { Extension } from "@codemirror/state";

import {
  LANGUAGE_LABELS,
  isLanguage,
  type SolutionLanguage,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";

/**
 * The code editor for a final solution.
 *
 * CodeMirror 6 (`@uiw/react-codemirror`) is bundled with the app rather than
 * loaded from a CDN: ThinkCode is local-first, and an editor that needs the
 * network to open is not usable offline. It is also a fraction of Monaco's
 * weight, which matters for a calm, fast personal tool.
 *
 * CodeMirror touches `window` while initializing, so the editor itself is
 * imported with `ssr: false` behind a same-height skeleton. The hidden input
 * still carries the value, so the surrounding form submits the code even
 * before (or without) the editor mounting.
 */

const CodeMirror = dynamic(() => import("@uiw/react-codemirror").then((mod) => mod.default), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center py-16">
      <Spinner label="Loading editor…" />
    </div>
  ),
});

// Loaded on demand: each language mode is a separate CodeMirror package.
const LANGUAGE_LOADERS: Record<SolutionLanguage, () => Promise<unknown>> = {
  python: () => import("@codemirror/lang-python").then((m) => m.python()),
  javascript: () => import("@codemirror/lang-javascript").then((m) => m.javascript()),
  typescript: () =>
    import("@codemirror/lang-javascript").then((m) => m.javascript({ typescript: true })),
  java: () => import("@codemirror/lang-java").then((m) => m.java()),
  cpp: () => import("@codemirror/lang-cpp").then((m) => m.cpp()),
  c: () => import("@codemirror/lang-cpp").then((m) => m.cpp()),
  go: () => import("@codemirror/lang-go").then((m) => m.go()),
  rust: () => import("@codemirror/lang-rust").then((m) => m.rust()),
  ruby: () => import("@codemirror/legacy-modes/mode/ruby").then((m) => m.ruby),
  swift: () => import("@codemirror/legacy-modes/mode/swift").then((m) => m.swift),
  kotlin: () => import("@codemirror/legacy-modes/mode/clike").then((m) => m.kotlin),
};

/**
 * Mode promises are cached for the life of the page so `use()` suspends once
 * per language instead of on every render. A failed import resolves to "no
 * mode" rather than rejecting: plain text still works, and the editor never
 * needs an error boundary.
 */
const extensionCache = new Map<string, Promise<Extension>>();

function getExtension(language: string): Promise<Extension> {
  if (!isLanguage(language)) return Promise.resolve([]);

  let pending = extensionCache.get(language);
  if (!pending) {
    pending = LANGUAGE_LOADERS[language]()
      .then((loaded) => loaded as Extension)
      .catch(() => [] as Extension);
    extensionCache.set(language, pending);
  }
  return pending;
}

function EditorSkeleton({ minHeight }: { minHeight: string }) {
  return (
    <div className="flex items-center justify-center" style={{ minHeight }}>
      <Spinner label="Loading editor…" />
    </div>
  );
}

/** The editor plus its syntax mode; suspends until the mode resolves. */
function EditorSurface({
  value,
  onChange,
  language,
  placeholder,
  minHeight,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  language: string;
  placeholder?: string;
  minHeight: string;
  label?: string;
}) {
  const extension = use(getExtension(language));

  return (
    <CodeMirror
      value={value}
      height={minHeight}
      theme="dark"
      onChange={onChange}
      placeholder={placeholder}
      aria-label={label}
      extensions={extension ? [extension] : []}
      basicSetup={{
        lineNumbers: true,
        foldGutter: false,
        highlightActiveLine: true,
        bracketMatching: true,
        closeBrackets: true,
        autocompletion: false,
      }}
    />
  );
}

export function CodeEditor({
  name = "code",
  value,
  onChange,
  language,
  placeholder,
  minHeight = "20rem",
  className,
  label,
}: {
  name?: string;
  value: string;
  onChange: (value: string) => void;
  language: string;
  placeholder?: string;
  minHeight?: string;
  className?: string;
  /** Accessible name for the editing region. */
  label?: string;
}) {
  const lineCount = value ? value.split("\n").length : 0;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <input type="hidden" name={name} value={value} />

      <div
        className="overflow-hidden rounded-lg border border-border bg-surface-2 focus-within:border-accent/60 focus-within:ring-2 focus-within:ring-accent/20"
        style={{ minHeight }}
      >
        <Suspense fallback={<EditorSkeleton minHeight={minHeight} />}>
          <EditorSurface
            value={value}
            onChange={onChange}
            language={language}
            placeholder={placeholder}
            minHeight={minHeight}
            label={label}
          />
        </Suspense>
      </div>

      <div className="flex items-center justify-between gap-2 text-xs text-muted">
        <span className="font-mono">
          {isLanguage(language) ? LANGUAGE_LABELS[language] : "Plain text"}
        </span>
        <span className="font-mono tabular-nums">
          {lineCount} {lineCount === 1 ? "line" : "lines"}
        </span>
      </div>
    </div>
  );
}
