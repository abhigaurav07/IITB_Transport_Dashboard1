"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useProjects } from "@/lib/projects/store";
import { CATEGORIES, STATUSES } from "@/lib/projects/types";
import ProjectCard from "./ProjectCard";

const SORTS = ["Newest", "Title A to Z"] as const;

const ctl =
  "h-10 rounded-lg border border-line bg-white px-3 text-sm text-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary";

export default function ProjectsExplorer() {
  const projects = useProjects();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("All");
  const [cat, setCat] = useState("All");
  const [sort, setSort] = useState<(typeof SORTS)[number]>("Newest");

  const shown = useMemo(() => {
    const n = q.trim().toLowerCase();
    return projects
      .filter((p) => status === "All" || p.status === status)
      .filter((p) => cat === "All" || p.category === cat)
      .filter((p) => !n || [p.title, p.summary, p.owner, p.tags.join(" ")].join(" ").toLowerCase().includes(n))
      .sort((a, b) => (sort === "Newest" ? b.createdAt.localeCompare(a.createdAt) : a.title.localeCompare(b.title)));
  }, [projects, q, status, cat, sort]);

  const filtered = q || status !== "All" || cat !== "All";

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
            <circle cx="11" cy="11" r="6.5" />
            <path strokeLinecap="round" d="m16 16 4 4" />
          </svg>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search projects" aria-label="Search projects" className={`${ctl} w-full pl-9`} />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status" className={ctl}>
          <option value="All">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Category" className={ctl}>
          <option value="All">All categories</option>
          {CATEGORIES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value as (typeof SORTS)[number])} aria-label="Sort" className={ctl}>
          {SORTS.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>

      <p className="mt-4 text-xs text-ink-muted" aria-live="polite">
        {shown.length} {shown.length === 1 ? "project" : "projects"}
        {filtered ? " match" : ""}
      </p>

      {shown.length ? (
        <div className="mt-3 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((p) => (
            <ProjectCard key={p.id} p={p} />
          ))}
        </div>
      ) : (
        <div className="mt-3 rounded-xl border border-dashed border-line px-6 py-14 text-center">
          <p className="text-sm font-medium text-ink">{filtered ? "No project matches" : "No projects yet"}</p>
          <p className="mt-1 text-sm text-ink-muted">{filtered ? "Try a different search or clear the filters." : "Create the first one to start the record."}</p>
          {filtered ? (
            <button
              type="button"
              onClick={() => {
                setQ("");
                setStatus("All");
                setCat("All");
              }}
              className="mt-4 text-sm font-medium text-primary hover:underline"
            >
              Clear filters
            </button>
          ) : (
            <Link href="/projects/new" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
              Create new project
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
