"use client";

import { useEffect, useId, useRef, useState } from "react";

import { mermaidRenderId } from "@/lib/visualization-utils";
import { Spinner } from "@/components/ui/spinner";

/**
 * The Mermaid renderer itself. Split out of `mermaid-diagram.tsx` and loaded
 * there with `ssr: false`, which is the only way to keep the library out of
 * the server bundle: a `"use client"` component is still server-rendered for
 * the initial HTML, and every `import()` it contains — even one inside a
 * `useEffect` — is traced into the SSR chunks. Two and a half megabytes of
 * diagram grammars would then ship inside the Workers bundle to serve a page
 * whose diagrams are, by construction, never drawn on the server.
 *
 * Mermaid touches `document` and `window` while initializing, so client-only
 * is also the honest way to use it.
 */

type MermaidApi = typeof import("mermaid").default;

type RenderStatus = "loading" | "ready" | "error";

/**
 * The library, loaded once per page and shared by every diagram on it.
 *
 * Caching the *promise* (not a resolved value) is what makes `initialize` run
 * exactly once even when two diagrams mount in the same tick: both callers
 * attach to the same import, and the config is applied before either of them
 * can render.
 */
let mermaidPromise: Promise<MermaidApi> | null = null;

function loadMermaid(): Promise<MermaidApi> {
  if (!mermaidPromise) {
    mermaidPromise = import("mermaid").then((mod) => {
      const mermaid = mod.default;

      mermaid.initialize({
        // ThinkCode renders every diagram itself; Mermaid never scans the page.
        startOnLoad: false,
        // Match the app's dark palette (see `app/globals.css` tokens) instead
        // of Mermaid's own dark-blue defaults.
        theme: "dark",
        // Sanitize the generated SVG. Nothing a user types can inject script
        // into the page.
        securityLevel: "strict",
        // The custom property is what `next/font` exposes to the document.
        fontFamily: "var(--font-inter), ui-sans-serif, system-ui, sans-serif",
        themeVariables: {
          background: "#0b0f1a",
          primaryColor: "#161e35",
          primaryTextColor: "#e6eaf4",
          primaryBorderColor: "#6366f1",
          lineColor: "#97a1b9",
          secondaryColor: "#1c2642",
          tertiaryColor: "#101627",
          mainBkg: "#161e35",
          secondBkg: "#1c2642",
          nodeBorder: "#6366f1",
          nodeTextColor: "#e6eaf4",
          clusterBkg: "#101627",
          clusterBorder: "#222d4e",
          edgeLabelBackground: "#0b0f1a",
          textColor: "#e6eaf4",
          titleColor: "#e6eaf4",
          actorBkg: "#161e35",
          actorBorder: "#6366f1",
          actorTextColor: "#e6eaf4",
          signalColor: "#97a1b9",
          signalTextColor: "#e6eaf4",
          labelBoxBkgColor: "#161e35",
          labelBoxBorderColor: "#6366f1",
          labelTextColor: "#e6eaf4",
          noteBkgColor: "#1c2642",
          noteTextColor: "#e6eaf4",
          noteBorderColor: "#6366f1",
          gridColor: "#222d4e",
          fontSize: "14px",
        },
      });

      return mermaid;
    });
  }

  return mermaidPromise;
}

export function MermaidRenderer({
  code,
  label,
}: {
  code: string;
  /** Accessible name of the figure, usually the visualization title. */
  label?: string;
}) {
  // `useId` is stable across re-renders and unique per component instance, so
  // two diagrams on the same page can never collide on Mermaid's generated ids.
  const renderId = mermaidRenderId(useId());
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<RenderStatus>("loading");

  useEffect(() => {
    let cancelled = false;

    // Every step below happens after the dynamic import resolves, so this
    // effect body itself never calls `setState` synchronously.
    loadMermaid()
      .then((mermaid) => mermaid.render(renderId, code))
      .then(({ svg, bindFunctions }) => {
        if (cancelled) return;

        const container = containerRef.current;
        if (!container) return;

        // Mermaid hands back markup, not a React tree; injecting it through the
        // ref is both the documented usage and the only sane one for a graph
        // this size.
        container.innerHTML = svg;
        bindFunctions?.(container);
        setStatus("ready");
      })
      .catch(() => {
        // A syntax error in the source is a normal thing to hit while writing,
        // not a crash: the card below explains it and keeps the source.
        if (cancelled) return;
        setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [code, renderId]);

  if (status === "error") {
    return (
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3">
        <p className="text-sm text-amber-200">
          This diagram could not be rendered — check the syntax.
        </p>
        <details className="mt-2">
          <summary className="cursor-pointer text-xs text-amber-200/80">
            Show the source
          </summary>
          <pre className="mt-2 overflow-x-auto whitespace-pre font-mono text-xs leading-relaxed text-muted">
            {code}
          </pre>
        </details>
      </div>
    );
  }

  return (
    <>
      {status === "loading" ? <Spinner label="Rendering diagram…" /> : null}
      <div
        ref={containerRef}
        role="img"
        aria-label={label ? `Diagram: ${label}` : "Mermaid diagram"}
        className="mermaid-surface mx-auto w-full [&>svg]:mx-auto [&>svg]:h-auto [&>svg]:max-w-full"
      />
    </>
  );
}
