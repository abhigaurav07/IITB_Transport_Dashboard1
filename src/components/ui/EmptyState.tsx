import type { ReactNode } from "react";

export default function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-line bg-surface px-6 py-14 text-center">
      <svg viewBox="0 0 48 48" className="mx-auto h-10 w-10 text-line" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
        <rect x="8" y="10" width="32" height="28" rx="4" />
        <path strokeLinecap="round" d="M8 20h32M16 28h10" />
      </svg>
      <p className="mt-3 text-sm font-semibold text-ink">{title}</p>
      {description ? <p className="mt-1 text-sm text-ink-muted">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
