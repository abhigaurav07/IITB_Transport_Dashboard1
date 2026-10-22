"use client";

import Link from "next/link";
import { useProject } from "@/lib/projects/store";
import { EXTRA_FIELDS } from "@/lib/projects/schema";
import { dateRange, fmtSize } from "@/lib/projects/format";
import StatusChip from "./StatusChip";

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  if (!v) return null;
  return (
    <div className="grid grid-cols-[130px_1fr] gap-3 border-b border-line py-3 text-sm last:border-0">
      <dt className="text-ink-muted">{k}</dt>
      <dd className="text-ink">{v}</dd>
    </div>
  );
}

export default function ProjectRecord({ slug }: { slug: string }) {
  const p = useProject(slug);
  if (!p)
    return (
      <div className="mx-auto w-full max-w-3xl px-5 py-20 text-center">
        <h1 className="text-xl font-semibold text-ink">Project not found</h1>
        <p className="mt-1.5 text-sm text-ink-muted">It may have been saved in a different browser.</p>
        <Link href="/projects" className="mt-5 inline-block text-sm font-medium text-primary hover:underline">
          All projects
        </Link>
      </div>
    );
  return (
    <div className="mx-auto w-full max-w-4xl px-5 py-10 lg:py-14">
      <Link href="/projects" className="text-xs font-medium text-ink-muted hover:text-primary">
        &larr; All projects
      </Link>
      {p.cover ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.cover} alt="" className="mt-4 h-52 w-full rounded-xl border border-line object-cover" />
      ) : null}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <StatusChip status={p.status} />
        <span className="text-xs text-ink-muted">{p.category}</span>
      </div>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink">{p.title}</h1>
      <p className="mt-2 text-base text-ink-muted">{p.summary}</p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="rounded-xl border border-line bg-white p-6">
          <h2 className="text-sm font-semibold text-ink">About</h2>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink-muted">{p.description || "No description added."}</p>
          {p.tags.length ? (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {p.tags.map((t) => (
                <span key={t} className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                  {t}
                </span>
              ))}
            </div>
          ) : null}
          <div className="mt-8 rounded-lg border border-dashed border-line px-4 py-6 text-center text-sm text-ink-muted">Results and modules for this project will appear here.</div>
        </div>
        <dl className="h-fit rounded-xl border border-line bg-white px-5 py-2">
          <Row k="Owner" v={p.owner} />
          <Row k="Team" v={p.team.join(", ")} />
          <Row k="Institute" v={p.organisation} />
          <Row k="Location" v={p.location} />
          <Row k="Dates" v={dateRange(p.startDate, p.endDate)} />
          {EXTRA_FIELDS.map((f) => (
            <Row key={f.id} k={f.label} v={p.extra[f.id]} />
          ))}
          {p.links.length ? (
            <Row
              k="Links"
              v={
                <ul className="space-y-1">
                  {p.links.map((l) => (
                    <li key={l.url}>
                      <a href={l.url} target="_blank" rel="noopener noreferrer" className="break-all text-primary hover:underline">
                        {l.label}
                      </a>
                    </li>
                  ))}
                </ul>
              }
            />
          ) : null}
          {p.files.length ? (
            <Row
              k="Files"
              v={
                <ul className="space-y-1">
                  {p.files.map((f) => (
                    <li key={f.name} className="break-all">
                      {f.name} <span className="text-xs text-ink-muted">{fmtSize(f.size)}</span>
                    </li>
                  ))}
                </ul>
              }
            />
          ) : null}
        </dl>
      </div>
    </div>
  );
}
