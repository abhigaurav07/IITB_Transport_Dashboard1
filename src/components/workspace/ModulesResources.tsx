"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { addModule, addResource, removeModule, removeResource, useAdditions } from "@/lib/projects/store";
import { projectDef } from "@/lib/projects/modules";
import { fmtDate } from "@/lib/projects/format";
import { MODULE_STATUSES, type ModuleStatus, type Project } from "@/lib/projects/types";
import { Button } from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { ChevronRightIcon } from "@/components/icons";
import { inputCls, isUrl } from "@/components/vault/form/fields";

const LOCAL_NOTE = "Saved in this browser only, until the shared database is connected.";

function Field({ id, label, optional, error, children }: { id: string; label: string; optional?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 flex items-baseline gap-2 text-sm font-medium text-ink">
        {label}
        {optional ? <span className="text-xs font-normal text-ink-muted">Optional</span> : <span className="text-danger">*</span>}
      </label>
      {children}
      {error ? <p className="mt-1.5 text-[13px] text-danger">{error}</p> : null}
    </div>
  );
}

const statusCls: Record<ModuleStatus, string> = {
  Planned: "border-line bg-canvas text-ink-muted",
  "In progress": "border-primary/25 bg-primary-50 text-primary",
  Completed: "border-success/25 bg-success-50 text-success",
};

export function ModulesPanel({ p }: { p: Project }) {
  const uid = useId();
  const def = projectDef(p.slug);
  const { modules } = useAdditions(p.id);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<ModuleStatus>("Planned");
  const [link, setLink] = useState("");
  const [err, setErr] = useState<{ name?: string; link?: string; save?: string }>({});

  function reset() {
    setName("");
    setDescription("");
    setStatus("Planned");
    setLink("");
    setErr({});
    setOpen(false);
  }
  function save() {
    const e: typeof err = {};
    if (!name.trim()) e.name = "Required";
    else if ([...(def?.modules.map((m) => m.label) ?? []), ...modules.map((m) => m.name)].some((n) => n.toLowerCase() === name.trim().toLowerCase())) e.name = "This project already has a module with this name";
    if (link.trim() && !isUrl(link.trim())) e.link = "Use a full address starting with http:// or https://";
    if (Object.keys(e).length) return setErr(e);
    const r = addModule(p.id, { name: name.trim(), description: description.trim(), status, link: link.trim() });
    if (!r.ok) return setErr({ save: r.error });
    reset();
  }

  const none = !def && modules.length === 0;
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="max-w-2xl text-sm text-ink-muted">Processed data, analyses and results. Raw data files are under Datasets.</p>
        {!open ? <Button type="button" onClick={() => setOpen(true)}>Add module</Button> : null}
      </div>

      {open ? (
        <div className="rounded-xl border border-line bg-surface p-5 shadow-card sm:p-6">
          <h3 className="text-base font-semibold text-ink">Add module</h3>
          <p className="mt-1 text-[13px] text-ink-muted">A module names one analysis in this project. {LOCAL_NOTE}</p>
          <div className="mt-4 grid gap-x-4 gap-y-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field id={`${uid}-n`} label="Module name" error={err.name}>
                <input id={`${uid}-n`} aria-invalid={!!err.name} value={name} maxLength={80} placeholder="e.g. Traffic Volume Analysis" onChange={(e) => setName(e.target.value)} className={inputCls} />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field id={`${uid}-d`} label="Description" optional>
                <textarea id={`${uid}-d`} rows={2} value={description} maxLength={300} onChange={(e) => setDescription(e.target.value)} className={inputCls} />
              </Field>
            </div>
            <Field id={`${uid}-s`} label="Status" optional>
              <select id={`${uid}-s`} value={status} onChange={(e) => setStatus(e.target.value as ModuleStatus)} className={inputCls}>
                {MODULE_STATUSES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Field>
            <Field id={`${uid}-l`} label="Link to the work" optional error={err.link}>
              <input id={`${uid}-l`} type="url" aria-invalid={!!err.link} value={link} placeholder="https://" onChange={(e) => setLink(e.target.value)} className={inputCls} />
            </Field>
          </div>
          {err.save ? <p role="alert" className="mt-3 text-[13px] text-danger">{err.save}</p> : null}
          <div className="mt-5 flex gap-2">
            <Button type="button" onClick={save}>Save module</Button>
            <Button type="button" variant="secondary" onClick={reset}>Cancel</Button>
          </div>
        </div>
      ) : null}

      {none && !open ? (
        <EmptyState title="No modules yet" description="Add a module to record an analysis for this project." action={<Button type="button" onClick={() => setOpen(true)}>Add module</Button>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {def?.modules.map((m) => (
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
          {modules.map((m) => (
            <div key={m.id} data-testid="custom-module" className="flex flex-col justify-between rounded-xl border border-line bg-surface p-5 shadow-card">
              <div>
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-base font-semibold text-ink">{m.name}</h3>
                  <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium ${statusCls[m.status]}`}>{m.status}</span>
                </div>
                {m.description ? <p className="mt-2 text-sm leading-relaxed text-ink-muted">{m.description}</p> : null}
                <p className="mt-2 text-xs text-ink-muted">Added {fmtDate(m.addedAt)}</p>
              </div>
              <div className="mt-5 flex items-center justify-between gap-3">
                {m.link ? (
                  <a href={m.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-sm font-medium text-primary hover:underline">
                    Open link
                    <ChevronRightIcon className="ml-0.5 h-4 w-4" />
                  </a>
                ) : (
                  <span />
                )}
                <button type="button" onClick={() => removeModule(p.id, m.id)} aria-label={`Remove module ${m.name}`} className="text-sm text-ink-muted hover:text-danger">
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ResourcesPanel({ p }: { p: Project }) {
  const uid = useId();
  const { resources } = useAdditions(p.id);
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");
  const [err, setErr] = useState<{ label?: string; url?: string; save?: string }>({});

  const all = [
    ...p.links.map((l) => ({ id: `link-${l.url}`, label: l.label, url: l.url, note: "", removable: false })),
    ...resources.map((r) => ({ id: r.id, label: r.label, url: r.url, note: r.note, removable: true })),
  ];

  function reset() {
    setLabel("");
    setUrl("");
    setNote("");
    setErr({});
    setOpen(false);
  }
  function save() {
    const e: typeof err = {};
    const u = url.trim();
    if (!u) e.url = "Required";
    else if (!isUrl(u)) e.url = "Use a full address starting with http:// or https://";
    else if (all.some((r) => r.url.toLowerCase() === u.toLowerCase())) e.url = "This link is already in the project";
    if (!label.trim()) e.label = "Required";
    if (Object.keys(e).length) return setErr(e);
    const r = addResource(p.id, { label: label.trim(), url: u, note: note.trim() });
    if (!r.ok) return setErr({ save: r.error });
    reset();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-2xl">
          <h2 className="text-lg font-semibold tracking-tight text-ink">Links and references</h2>
          <p className="mt-1 text-sm text-ink-muted">Papers, GitHub repositories, shared drives, standards and other pages related to this project. Raw data files go under Datasets.</p>
        </div>
        {!open ? <Button type="button" onClick={() => setOpen(true)}>Add resource</Button> : null}
      </div>

      {open ? (
        <div className="rounded-xl border border-line bg-surface p-5 shadow-card sm:p-6">
          <h3 className="text-base font-semibold text-ink">Add resource</h3>
          <p className="mt-1 text-[13px] text-ink-muted">{LOCAL_NOTE}</p>
          <div className="mt-4 grid gap-x-4 gap-y-4 sm:grid-cols-2">
            <Field id={`${uid}-l`} label="Title" error={err.label}>
              <input id={`${uid}-l`} aria-invalid={!!err.label} value={label} maxLength={90} placeholder="e.g. IRC:SP:16 guidelines" onChange={(e) => setLabel(e.target.value)} className={inputCls} />
            </Field>
            <Field id={`${uid}-u`} label="Link" error={err.url}>
              <input id={`${uid}-u`} type="url" aria-invalid={!!err.url} value={url} placeholder="https://" onChange={(e) => setUrl(e.target.value)} className={inputCls} />
            </Field>
            <div className="sm:col-span-2">
              <Field id={`${uid}-n`} label="Note" optional>
                <input id={`${uid}-n`} value={note} maxLength={200} onChange={(e) => setNote(e.target.value)} className={inputCls} />
              </Field>
            </div>
          </div>
          {err.save ? <p role="alert" className="mt-3 text-[13px] text-danger">{err.save}</p> : null}
          <div className="mt-5 flex gap-2">
            <Button type="button" onClick={save}>Save resource</Button>
            <Button type="button" variant="secondary" onClick={reset}>Cancel</Button>
          </div>
        </div>
      ) : null}

      {all.length === 0 && p.files.length === 0 ? (
        open ? null : <EmptyState title="No resources yet" description="Add links to papers, repositories or reference pages for this project." action={<Button type="button" onClick={() => setOpen(true)}>Add resource</Button>} />
      ) : (
        <ul className="divide-y divide-line-soft rounded-xl border border-line bg-surface shadow-card">
          {all.map((r) => (
            <li key={r.id} data-testid="resource-row" className="flex items-start justify-between gap-4 px-5 py-3.5 text-sm">
              <div className="min-w-0">
                <a href={r.url} target="_blank" rel="noopener noreferrer" className="break-all font-medium text-primary hover:underline">
                  {r.label}
                </a>
                <p className="break-all text-xs text-ink-muted">{r.url}</p>
                {r.note ? <p className="mt-1 text-[13px] text-ink-muted">{r.note}</p> : null}
              </div>
              {r.removable ? (
                <button type="button" onClick={() => removeResource(p.id, r.id)} aria-label={`Remove ${r.label}`} className="shrink-0 text-ink-muted hover:text-danger">
                  Remove
                </button>
              ) : null}
            </li>
          ))}
          {p.files.map((f) => (
            <li key={f.name} className="px-5 py-3.5 text-sm text-ink">
              {f.name} <span className="text-xs text-ink-muted">File name only, from an earlier version</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
