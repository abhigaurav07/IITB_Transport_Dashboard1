import Link from "next/link";

export interface Crumb {
  label: string;
  href?: string;
}

/** Last item is the current page and is not a link. */
export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1 text-[13px] text-ink-muted">
        {items.map((c, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${c.label}-${i}`} className="flex min-w-0 items-center gap-1.5">
              {i > 0 ? (
                <svg viewBox="0 0 16 16" className="h-3 w-3 shrink-0 text-line" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m6 3.5 4.5 4.5L6 12.5" />
                </svg>
              ) : null}
              {c.href && !last ? (
                <Link href={c.href} className="truncate rounded px-0.5 hover:text-primary hover:underline">
                  {c.label}
                </Link>
              ) : (
                <span aria-current={last ? "page" : undefined} className={`truncate ${last ? "font-medium text-ink" : ""}`}>
                  {c.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
