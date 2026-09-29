"use client";

import dynamic from "next/dynamic";

import { Spinner } from "@/components/ui/spinner";

/**
 * The frame around a Mermaid diagram, and the client-only boundary that keeps
 * Mermaid itself off the server.
 *
 * Mermaid is by far the heaviest dependency in the app — a few megabytes of
 * diagram grammars — and a diagram is drawn by the browser or not at all. So
 * the renderer is imported with `ssr: false` (which is only available inside a
 * Client Component, hence this file) instead of merely being `import()`ed from
 * an effect. Both matter: `"use client"` alone still server-renders the
 * component, and the bundler then traces every `import()` it mentions into the
 * SSR chunks. `ssr: false` puts the renderer in its own browser-only chunk that
 * is fetched the first time a diagram actually mounts.
 *
 * The bordered frame lives here rather than in the renderer so the layout does
 * not jump between the `loading` placeholder and the real thing.
 */

const MermaidRenderer = dynamic(
  () => import("@/components/visualizations/mermaid-renderer").then((mod) => mod.MermaidRenderer),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-24 items-center justify-center px-3 py-4">
        <Spinner label="Rendering diagram…" />
      </div>
    ),
  }
);

function DiagramFrame({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={
        "flex min-h-24 items-center justify-center overflow-x-auto rounded-lg border border-border bg-surface-2/40 px-3 py-4 " +
        (className ?? "")
      }
    >
      {children}
    </div>
  );
}

export function MermaidDiagram({
  code,
  label,
  className,
}: {
  code: string;
  /** Accessible name of the figure, usually the visualization title. */
  label?: string;
  className?: string;
}) {
  return (
    <DiagramFrame className={className}>
      <MermaidRenderer code={code} label={label} />
    </DiagramFrame>
  );
}
