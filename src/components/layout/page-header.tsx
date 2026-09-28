export function PageHeader({
  title,
  description,
  eyebrow,
}: {
  title: string;
  description?: string;
  eyebrow?: string;
}) {
  return (
    <div className="mb-8 flex flex-col gap-1.5">
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-widest text-accent">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
        {title}
      </h1>
      {description ? (
        <p className="max-w-2xl text-sm leading-relaxed text-muted">
          {description}
        </p>
      ) : null}
    </div>
  );
}