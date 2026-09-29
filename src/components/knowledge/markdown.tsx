import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";

import { cn } from "@/lib/utils";

/**
 * Renders a note body written in markdown.
 *
 * Safe by construction: react-markdown only emits React elements, and raw HTML
 * stays literal text because `rehype-raw` is deliberately not installed — a
 * note can never inject markup into the page. `remark-gfm` adds tables,
 * strikethrough, and task lists; `rehype-highlight` colours fenced code blocks
 * with the highlight.js theme imported in `globals.css`.
 *
 * Usable from both server and client components — the editor preview and the
 * "Read" views both need it.
 */
export function Markdown({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  return (
    <div className={cn("markdown-body", className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
