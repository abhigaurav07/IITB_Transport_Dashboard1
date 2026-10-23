import type { ReactNode } from "react";

/** Titled content container used on project and module pages. */
export default function Section({ title, description, children, className = "" }: { title?: string; description?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl border border-line bg-surface p-5 shadow-card sm:p-6 ${className}`}>
      {title ? <h2 className="text-lg font-semibold tracking-tight text-ink">{title}</h2> : null}
      {description ? <p className="mt-1 text-sm text-ink-muted">{description}</p> : null}
      <div className={title || description ? "mt-4" : ""}>{children}</div>
    </section>
  );
}
