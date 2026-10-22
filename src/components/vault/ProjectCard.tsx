import Link from "next/link";
import type { Project } from "@/lib/projects/types";
import { dateRange } from "@/lib/projects/format";
import StatusChip from "./StatusChip";
import { ChevronRightIcon } from "@/components/icons";

function Cover({ p }: { p: Project }) {
  if (p.cover) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={p.cover} alt="" className="h-32 w-full object-cover" />;
  }
  // Generated abstract cover: stable per project, uses only the accent shades.
  let h = 0;
  for (const c of p.slug) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const pts = Array.from({ length: 24 }, (_, i) => {
    const x = (i / 23) * 320;
    const y = 70 - 22 * Math.sin(i * 0.55 + (h % 7)) - 10 * Math.sin(i * 1.9 + (h % 5)) - (h % 13);
    return `${i ? "L" : "M"}${x.toFixed(0)} ${y.toFixed(0)}`;
  }).join(" ");
  return (
    <svg viewBox="0 0 320 128" className="h-32 w-full" preserveAspectRatio="none" aria-hidden>
      <rect width="320" height="128" fill="#eff6ff" />
      <path d={`${pts} L320 128 L0 128 Z`} fill="#1d4ed8" opacity=".08" />
      <path d={pts} fill="none" stroke="#1d4ed8" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export default function ProjectCard({ p }: { p: Project }) {
  const href = p.href ?? `/projects/${p.slug}`;
  return (
    <Link
      href={href}
      className="group flex flex-col overflow-hidden rounded-xl border border-line bg-white transition hover:border-primary/40 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <Cover p={p} />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between gap-3">
          <StatusChip status={p.status} />
          <span className="truncate text-[11px] text-ink-muted">{p.category}</span>
        </div>
        <h3 className="mt-3 text-base font-semibold leading-snug text-ink">{p.title}</h3>
        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-ink-muted">{p.summary}</p>
        {p.tags.length ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {p.tags.slice(0, 3).map((t) => (
              <span key={t} className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-600">
                {t}
              </span>
            ))}
            {p.tags.length > 3 ? <span className="px-1 text-[11px] text-ink-muted">+{p.tags.length - 3}</span> : null}
          </div>
        ) : null}
        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
          <div className="min-w-0 text-xs text-ink-muted">
            <p className="truncate font-medium text-ink">{p.owner || "No owner"}</p>
            <p className="truncate">{dateRange(p.startDate, p.endDate)}</p>
          </div>
          <span className="inline-flex shrink-0 items-center text-sm font-medium text-primary">
            Open
            <ChevronRightIcon className="ml-0.5 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
