"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAllDatasets, useHydrated, useProject } from "@/lib/projects/store";
import { projectDef } from "@/lib/projects/modules";
import { fmtDate } from "@/lib/projects/format";
import { EXTRA_FIELDS } from "@/lib/projects/schema";
import type { Project } from "@/lib/projects/types";
import PageHeader from "@/components/ui/PageHeader";
import Section from "@/components/ui/Section";
import Tag from "@/components/ui/Tag";
import EmptyState from "@/components/ui/EmptyState";
import { LinkButton } from "@/components/ui/Button";
import { ChevronRightIcon } from "@/components/icons";
import StatusChip from "@/components/vault/StatusChip";
import ProjectArt from "@/components/vault/ProjectArt";
import DatasetsPanel from "./DatasetsPanel";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "datasets", label: "Datasets" },
  { id: "modules", label: "Modules" },
  { id: "resources", label: "Resources" },
] as const;
type TabId = (typeof TABS)[number]["id"];

function Row({ k, v }: { k: string; v?: React.ReactNode }) {
  if (!v) return null;
  return (
    <div className="grid grid-cols-[110px_1fr] gap-3 border-b border-line-soft py-3 text-sm last:border-0">
      <dt className="text-ink-muted">{k}</dt>
      <dd className="min-w-0 break-words text-ink">{v}</dd>
    </div>
  );
}

function Overview({ p, datasetCount, categoryCount, go }: { p: Project; datasetCount: number; categoryCount: number; go: (t: TabId) => void }) {
  const c = p.client;
  const hasClient = Object.values(c).some(Boolean);
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        <Section title="About">
          <p className="whitespace-pre-line text-[15px] leading-relaxed text-ink-muted">{p.description || "No description added."}</p>
          {p.tags.length ? (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {p.tags.map((t) => (
                <Tag key={t}>{t}</Tag>
              ))}
            </div>
          ) : null}
        </Section>
        <Section title="Raw datasets">
          {datasetCount ? (
            <p className="text-sm text-ink-muted">
              {datasetCount} {datasetCount === 1 ? "dataset" : "datasets"} in {categoryCount} {categoryCount === 1 ? "category" : "categories"}.{" "}
              <button type="button" onClick={() => go("datasets")} className="font-medium text-primary hover:underline">
                Open datasets
              </button>
            </p>
          ) : (
            <p className="text-sm text-ink-muted">
              No raw datasets yet.{" "}
              <button type="button" onClick={() => go("datasets")} className="font-medium text-primary hover:underline">
                Add datasets
              </button>
            </p>
          )}
        </Section>
        {hasClient ? (
          <Section title="Client and contacts" description="Sensitive. Stored in this browser only until access control exists.">
            <dl className="-my-3">
              <Row k="Client" v={c.organisation} />
              <Row k="Contact" v={c.contactName} />
              <Row k="Designation" v={c.designation} />
              <Row k="Email" v={c.email ? <a className="text-primary hover:underline" href={`mailto:${c.email}`}>{c.email}</a> : ""} />
              <Row k="Phone" v={c.phone} />
              <Row k="Additional" v={<span className="whitespace-pre-line">{c.additional}</span>} />
            </dl>
          </Section>
        ) : null}
      </div>
      <div className="h-fit space-y-6">
        <div className="aspect-[9/4] overflow-hidden rounded-xl border border-line shadow-card">
          {p.cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.cover} alt="" className="h-full w-full object-cover" />
          ) : (
            <ProjectArt project={p} />
          )}
        </div>
        <Section title="Details">
          <dl className="-my-3">
            <Row k="Project ID" v={<span className="font-mono text-[13px]">{p.projectId}</span>} />
            <Row k="Owner" v={p.owner} />
            <Row k="Team" v={p.team.join(", ")} />
            <Row k="Institute" v={p.organisation} />
            <Row k="Location" v={p.location} />
            <Row k="Start date" v={fmtDate(p.startDate)} />
            <Row k="End date" v={fmtDate(p.endDate)} />
            <Row k="Record created" v={fmtDate(p.createdAt)} />
            {EXTRA_FIELDS.map((f) => (
              <Row key={f.id} k={f.label} v={p.extra[f.id]} />
            ))}
          </dl>
        </Section>
      </div>
    </div>
  );
}

function Modules({ p }: { p: Project }) {
  const def = projectDef(p.slug);
  if (!def)
    return <EmptyState title="No modules yet" description="Analyses and results for this project will appear here as modules are added." />;
  return (
    <div>
      <p className="mb-3 text-sm text-ink-muted">Processed data, analyses and results.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {def.modules.map((m) => (
          <Link
            key={m.path}
            href={`/projects/${p.slug}/${m.path}`}
            className="group flex flex-col justify-between rounded-xl border border-line bg-surface p-5 shadow-card hover:-translate-y-0.5 hover:border-navy/30 hover:shadow-lift"
          >
            <div>
              <div className="flex items-center gap-2.5">
                {m.number ? <span className="flex h-6 w-6 items-center justify-center rounded-md bg-navy-50 text-xs font-semibold text-navy">{m.number}</span> : null}
                <h3 className="text-base font-semibold text-ink">{m.label}</h3>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">{m.description}</p>
            </div>
            <span className="mt-5 inline-flex items-center text-sm font-medium text-primary">
              Open module
              <ChevronRightIcon className="ml-0.5 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function Resources({ p }: { p: Project }) {
  if (!p.links.length && !p.files.length)
    return <EmptyState title="No resources yet" description="External links and references added to this project are listed here. Raw data files are under Datasets." />;
  return (
    <Section title="Links and references" description="External links. Raw data files are under Datasets.">
      <ul className="divide-y divide-line-soft">
        {p.links.map((l) => (
          <li key={l.url} className="py-2.5 text-sm">
            <a href={l.url} target="_blank" rel="noopener noreferrer" className="break-all font-medium text-primary hover:underline">
              {l.label}
            </a>
            <p className="break-all text-xs text-ink-muted">{l.url}</p>
          </li>
        ))}
        {p.files.map((f) => (
          <li key={f.name} className="py-2.5 text-sm text-ink">
            {f.name} <span className="text-xs text-ink-muted">File name only, from an earlier version</span>
          </li>
        ))}
      </ul>
    </Section>
  );
}

/**
 * Project workspace: Overview, Datasets, Modules and Resources. The open tab is
 * kept in the URL hash so a refresh or a shared link returns to it.
 */
export default function ProjectWorkspace({ slug, crumbs = false }: { slug: string; crumbs?: boolean }) {
  const p = useProject(slug);
  const hydrated = useHydrated();
  const all = useAllDatasets();
  const [tab, setTab] = useState<TabId>("overview");

  useEffect(() => {
    const read = () => {
      const h = window.location.hash.replace("#", "") as TabId;
      setTab(TABS.some((t) => t.id === h) ? h : "overview");
    };
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);

  const choose = useCallback((t: TabId) => {
    setTab(t);
    window.history.replaceState(null, "", t === "overview" ? window.location.pathname : `#${t}`);
  }, []);

  if (!p) {
    if (!hydrated) return <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6" aria-busy />;
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
        <EmptyState
          title="Project not found"
          description="New projects are saved in the browser they were created in, so it may be in a different browser."
          action={<LinkButton href="/projects">Existing Projects</LinkButton>}
        />
      </div>
    );
  }

  const mine = all.filter((d) => d.projectRef === p.id);
  const categoryCount = new Set(mine.map((d) => d.category)).size;
  const modulesCount = projectDef(p.slug)?.modules.length ?? 0;

  const header = (
    <PageHeader
      crumbs={crumbs ? [{ label: "Home", href: "/" }, { label: "Existing Projects", href: "/projects" }, { label: p.title }] : undefined}
      eyebrow={crumbs ? undefined : "Project"}
      title={p.title}
      description={p.summary}
      meta={
        <>
          <StatusChip status={p.status} />
          <span className="text-[13px] text-ink-muted">{p.category}</span>
          <span className="rounded-md border border-line-soft bg-canvas px-2 py-0.5 font-mono text-xs text-ink-muted">{p.projectId}</span>
        </>
      }
    />
  );

  const counts: Partial<Record<TabId, number>> = { datasets: mine.length, modules: modulesCount };

  return (
    <div className={crumbs ? "mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:py-14" : ""}>
      {header}
      <div role="tablist" aria-label="Project areas" className="mt-6 flex gap-1 overflow-x-auto border-b border-line">
        {TABS.map((t, i) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`tab-${t.id}`}
              aria-selected={active}
              aria-controls={`panel-${t.id}`}
              tabIndex={active ? 0 : -1}
              onClick={() => choose(t.id)}
              onKeyDown={(e) => {
                const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
                if (!d) return;
                e.preventDefault();
                const n = TABS[(i + d + TABS.length) % TABS.length].id;
                choose(n);
                document.getElementById(`tab-${n}`)?.focus();
              }}
              className={`-mb-px whitespace-nowrap border-b-2 px-4 py-2.5 text-sm ${active ? "border-navy font-medium text-navy" : "border-transparent text-ink-muted hover:text-ink"}`}
            >
              {t.label}
              {counts[t.id] ? <span className="ml-1.5 rounded-full bg-navy-50 px-1.5 py-0.5 text-[11px] tabular-nums text-navy">{counts[t.id]}</span> : null}
            </button>
          );
        })}
      </div>
      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="mt-6">
        {tab === "overview" ? <Overview p={p} datasetCount={mine.length} categoryCount={categoryCount} go={choose} /> : null}
        {tab === "datasets" ? <DatasetsPanel project={p} /> : null}
        {tab === "modules" ? <Modules p={p} /> : null}
        {tab === "resources" ? <Resources p={p} /> : null}
      </div>
    </div>
  );
}
