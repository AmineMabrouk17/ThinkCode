/**
 * The problem page is the heart of ThinkCode: one ordered stack of sections, from
 * the raw thinking to the final solution.
 *
 * Only the frame lives here. Each section owns its own component — the thinking
 * sessions, the knowledge notes, the solution editor, the resources, the
 * drawings and the review history all live in their own files — because they
 * have genuinely different shapes, and a shared "row renderer" would have ended
 * up as a lowest-common-denominator with a `type` field.
 */
export function ProblemSection({
  id,
  emoji,
  title,
  hint,
  children,
}: {
  id: string;
  emoji: string;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline gap-2">
        <h2
          id={id}
          className="text-base font-semibold tracking-tight text-ink"
        >
          <span aria-hidden>{emoji}</span> {title}
        </h2>
        {hint ? <p className="text-xs text-muted">{hint}</p> : null}
      </div>
      {children}
    </section>
  );
}
