import type { ReactNode } from "react";
import Breadcrumbs, { type Crumb } from "./Breadcrumbs";

export default function PageHeader({
  crumbs,
  eyebrow,
  title,
  description,
  meta,
  actions,
}: {
  crumbs?: Crumb[];
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  /** Chips or key facts shown under the description. */
  meta?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header>
      {crumbs ? <Breadcrumbs items={crumbs} /> : null}
      <div className={`flex flex-wrap items-end justify-between gap-4 ${crumbs ? "mt-4" : ""}`}>
        <div className="min-w-0 max-w-3xl">
          {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">{eyebrow}</p> : null}
          <h1 className={`${eyebrow ? "mt-1.5" : ""} text-[28px] font-semibold leading-tight tracking-tight text-ink sm:text-[32px]`}>{title}</h1>
          {description ? <p className="mt-2 text-[15px] leading-relaxed text-ink-muted">{description}</p> : null}
          {meta ? <div className="mt-4 flex flex-wrap items-center gap-2">{meta}</div> : null}
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}
