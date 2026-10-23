"use client";

import { useMemo, useState } from "react";
import type { Dataset, Project } from "@/lib/projects/types";
import { useAllDatasets } from "@/lib/projects/store";
import { addDatasetsToProject, draftErrors, type DatasetDraft, type StatusMap } from "@/lib/projects/create";
import { getFile } from "@/lib/projects/files";
import { fmtDate, fmtSize, periodLabel } from "@/lib/projects/format";
import { Button } from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import Tag from "@/components/ui/Tag";
import DatasetUploader from "@/components/vault/DatasetUploader";

const ctl = "h-10 rounded-lg border border-line bg-surface px-3 text-sm text-ink hover:border-navy/40";

function DatasetRow({ d }: { d: Dataset }) {
  const [err, setErr] = useState("");
  async function download() {
    setErr("");
    try {
      const blob = await getFile(d.fileKey);
      if (!blob) {
        setErr("The file is not in this browser's storage. It may have been cleared, or the project was created in another browser.");
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = d.originalFilename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "The file could not be read.");
    }
  }
  const period = periodLabel(d.periodFrom, d.periodTo);
  return (
    <li className="rounded-xl border border-line bg-surface p-4 shadow-card sm:p-5" data-testid="dataset-row">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="text-base font-semibold text-ink">{d.name}</h4>
          <p className="mt-0.5 break-all font-mono text-xs text-ink-muted">{d.originalFilename}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Tag>{d.category}</Tag>
          <span
            title="The file is saved in this browser only. It is not shared with other users or devices."
            className="inline-flex rounded-full border border-warning/25 bg-warning-50 px-2 py-0.5 text-[11px] font-medium text-warning"
          >
            Stored in this browser
          </span>
        </div>
      </div>
      {d.description ? <p className="mt-3 text-sm leading-relaxed text-ink-muted">{d.description}</p> : null}
      <dl className="mt-3 grid gap-x-6 gap-y-1 text-[13px] sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <dt className="text-ink-muted">Format and size</dt>
          <dd className="text-ink">
            {d.format} &middot; {fmtSize(d.size)}
          </dd>
        </div>
        <div>
          <dt className="text-ink-muted">Uploaded</dt>
          <dd className="text-ink">{fmtDate(d.uploadedAt)}</dd>
        </div>
        <div>
          <dt className="text-ink-muted">Collection period</dt>
          <dd className="text-ink">{period || "Not given"}</dd>
        </div>
        <div>
          <dt className="text-ink-muted">Checksum (SHA-256)</dt>
          <dd className="font-mono text-ink" title={d.sha256}>
            {d.sha256 ? `${d.sha256.slice(0, 12)}…` : "Not recorded"}
          </dd>
        </div>
      </dl>
      {d.remarks ? <p className="mt-3 text-[13px] text-ink-muted"><span className="font-medium text-ink">Remarks:</span> {d.remarks}</p> : null}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button type="button" variant="secondary" onClick={download}>
          Download original file
        </Button>
        {err ? (
          <p role="alert" className="text-[13px] text-danger">
            {err}
          </p>
        ) : null}
      </div>
    </li>
  );
}

export default function DatasetsPanel({ project }: { project: Project }) {
  const all = useAllDatasets();
  const datasets = useMemo(() => all.filter((d) => d.projectRef === project.id), [all, project.id]);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [adding, setAdding] = useState(false);
  const [drafts, setDrafts] = useState<DatasetDraft[]>([]);
  const [statuses, setStatuses] = useState<StatusMap>({});
  const [saving, setSaving] = useState(false);
  const [showErr, setShowErr] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const cats = useMemo(() => {
    const m = new Map<string, number>();
    datasets.forEach((d) => m.set(d.category, (m.get(d.category) ?? 0) + 1));
    return Array.from(m.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [datasets]);

  const n = q.trim().toLowerCase();
  const shown = datasets
    .filter((d) => cat === "All" || d.category === cat)
    .filter((d) => !n || [d.name, d.originalFilename, d.description, d.category, d.remarks, d.format].join(" ").toLowerCase().includes(n))
    .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
  const grouped = cat === "All" && cats.length > 1;
  const groups = grouped ? cats.map(([c]) => [c, shown.filter((d) => d.category === c)] as const).filter(([, l]) => l.length) : [["", shown] as const];
  const filtered = n !== "" || cat !== "All";

  async function save() {
    setShowErr(true);
    if (!drafts.length || drafts.some((d) => Object.keys(draftErrors(d)).length)) return;
    setSaving(true);
    setMsg(null);
    const r = await addDatasetsToProject(project.id, drafts, (id, s) => setStatuses((m) => ({ ...m, [id]: s })));
    setSaving(false);
    if (!r.ok) {
      setMsg({ ok: false, text: r.error });
      return;
    }
    setDrafts([]);
    setStatuses({});
    setShowErr(false);
    setAdding(false);
    setMsg({ ok: true, text: `${r.count} ${r.count === 1 ? "dataset" : "datasets"} saved in this browser.` });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-2xl">
          <h2 className="text-lg font-semibold tracking-tight text-ink">Raw datasets</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Data files as collected, unchanged. Processed data, analytical results and reports are kept apart, under Modules. Files are saved in this browser only; they are not shared with other users or devices yet.
          </p>
        </div>
        {!adding ? (
          <Button type="button" onClick={() => { setAdding(true); setMsg(null); }}>
            Add datasets
          </Button>
        ) : null}
      </div>

      {msg ? (
        <p role={msg.ok ? "status" : "alert"} className={`rounded-lg border px-4 py-3 text-sm ${msg.ok ? "border-success/25 bg-success-50 text-success" : "border-danger/30 bg-danger-50 text-danger"}`}>
          {msg.text}
        </p>
      ) : null}

      {adding ? (
        <div className="rounded-xl border border-line bg-surface p-5 shadow-card sm:p-6">
          <h3 className="text-base font-semibold text-ink">Add datasets</h3>
          <div className="mt-4">
            <DatasetUploader drafts={drafts} onChange={setDrafts} statuses={statuses} takenNames={datasets.map((d) => d.originalFilename.toLowerCase())} disabled={saving} showErrors={showErr} />
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Button type="button" onClick={save} disabled={saving || drafts.length === 0} aria-busy={saving}>
              {saving ? "Saving" : `Save ${drafts.length || ""} ${drafts.length === 1 ? "dataset" : "datasets"}`.replace("  ", " ")}
            </Button>
            <Button type="button" variant="secondary" disabled={saving} onClick={() => { setAdding(false); setDrafts([]); setStatuses({}); setShowErr(false); }}>
              Cancel
            </Button>
          </div>
        </div>
      ) : null}

      {datasets.length === 0 ? (
        adding ? null : (
          <EmptyState
            title="No raw datasets yet"
            description="Raw data files for this project will be listed here, grouped by category."
            action={<Button type="button" onClick={() => setAdding(true)}>Add datasets</Button>}
          />
        )
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-surface p-3 shadow-card">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, file name or description" aria-label="Search datasets" className={`${ctl} min-w-[220px] flex-1 placeholder:text-slate-400`} />
            <select value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Dataset category" className={ctl}>
              <option value="All">All categories ({datasets.length})</option>
              {cats.map(([c, k]) => (
                <option key={c} value={c}>
                  {c} ({k})
                </option>
              ))}
            </select>
            {filtered ? (
              <button type="button" onClick={() => { setQ(""); setCat("All"); }} className="text-sm font-medium text-primary hover:underline">
                Clear filters
              </button>
            ) : null}
          </div>
          <p className="text-[13px] text-ink-muted" aria-live="polite">
            {shown.length} of {datasets.length} {datasets.length === 1 ? "dataset" : "datasets"} in {cats.length} {cats.length === 1 ? "category" : "categories"}
          </p>
          {shown.length === 0 ? (
            <EmptyState title="No datasets match" description="Try a different search or category." action={<Button type="button" variant="secondary" onClick={() => { setQ(""); setCat("All"); }}>Clear filters</Button>} />
          ) : (
            groups.map(([c, list]) => (
              <section key={c || "all"} aria-label={c || "Datasets"}>
                {grouped ? (
                  <h3 className="mb-3 text-sm font-semibold text-ink">
                    {c} <span className="font-normal text-ink-muted">({list.length})</span>
                  </h3>
                ) : null}
                <ul className="space-y-3">
                  {list.map((d) => (
                    <DatasetRow key={d.id} d={d} />
                  ))}
                </ul>
              </section>
            ))
          )}
        </>
      )}
    </div>
  );
}
