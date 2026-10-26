"use client";

import { useMemo, useState } from "react";
import { useAllDatasets, useProjects } from "@/lib/projects/store";
import { STATUSES } from "@/lib/projects/types";
import ProjectCard from "./ProjectCard";
import EmptyState from "@/components/ui/EmptyState";
import { LinkButton } from "@/components/ui/Button";

const SORTS = ["Newest", "Title A to Z"] as const;

const ctl =
  "h-10 rounded-lg border border-line bg-surface px-3 text-sm text-ink hover:border-navy/40";

export default function ProjectsExplorer() {
  const projects = useProjects();
  const allDatasets = useAllDatasets();
  const summary = useMemo(() => {
    const m = new Map<string, { count: number; cats: Set<string> }>();
    for (const d of allDatasets) {
      const e = m.get(d.projectRef) ?? { count: 0, cats: new Set<string>() };
      e.count++;
      e.cats.add(d.category);
      m.set(d.projectRef, e);
    }
    return m;
  }, [allDatasets]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("All");
  const [sort, setSort] = useState<(typeof SORTS)[number]>("Newest");

  const shown = useMemo(() => {
    const n = q.trim().toLowerCase();
    return projects
      .filter((p) => status === "All" || p.status === status)
      .filter((p) => !n || [p.title, p.summary, p.owner, p.projectId, p.client.organisation, p.tags.join(" ")].join(" ").toLowerCase().includes(n))
      .sort((a, b) => (sort === "Newest" ? b.createdAt.localeCompare(a.createdAt) : a.title.localeCompare(b.title)));
  }, [projects, q, status, sort]);

  const filtered = q.trim() !== "" || status !== "All";
  const clear = () => {
    setQ("");
    setStatus("All");
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-surface p-3 shadow-card">
        <div className="relative min-w-[220px] flex-1">
          <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
            <circle cx="11" cy="11" r="6.5" />
            <path strokeLinecap="round" d="m16 16 4 4" />
          </svg>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by title, ID, owner or tag" aria-label="Search projects" className={`${ctl} w-full pl-9 placeholder:text-slate-400`} />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status" className={ctl}>
          <option value="All">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value as (typeof SORTS)[number])} aria-label="Sort" className={ctl}>
          {SORTS.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-[13px] text-ink-muted" aria-live="polite">
          {shown.length} {shown.length === 1 ? "project" : "projects"}
          {filtered ? " match" : ""}
        </p>
        {filtered ? (
          <button type="button" onClick={clear} className="rounded-md px-2 py-1 text-[13px] font-medium text-primary hover:bg-primary-50">
            Clear filters
          </button>
        ) : null}
      </div>

      {shown.length ? (
        <div className="mt-3 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((p, i) => (
            <ProjectCard key={p.id} index={i} p={p} datasets={summary.has(p.id) ? { count: summary.get(p.id)!.count, categories: summary.get(p.id)!.cats.size } : undefined} />
          ))}
        </div>
      ) : (
        <div className="mt-3">
          <EmptyState
            title={filtered ? "No project matches" : "No projects yet"}
            description={filtered ? "Try a different search, or clear the filters." : "Create the first project to start the record."}
            action={
              filtered ? (
                <button type="button" onClick={clear} className="text-sm font-medium text-primary hover:underline">
                  Clear filters
                </button>
              ) : (
                <LinkButton href="/projects/new">Create a Project</LinkButton>
              )
            }
          />
        </div>
      )}
    </div>
  );
}
