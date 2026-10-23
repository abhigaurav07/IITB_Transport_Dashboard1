"use client";

import { useId, useRef, useState } from "react";
import { ACCEPT, FORMAT_LIST, MAX_FILE_BYTES, extOf, inspectFile, stripExt } from "@/lib/projects/datasetFiles";
import { draftErrors, type DatasetDraft, type StatusMap } from "@/lib/projects/create";
import { useAllDatasets, usedCategories } from "@/lib/projects/store";
import { DATASET_CATEGORIES } from "@/lib/projects/types";
import { fmtSize } from "@/lib/projects/format";
import { inputCls } from "./form/fields";

const CUSTOM = "__custom";

function CategoryPicker({ id, value, onChange, error }: { id: string; value: string; onChange: (v: string) => void; error?: string }) {
  const all = useAllDatasets();
  const options = Array.from(new Set<string>([...DATASET_CATEGORIES.filter((c) => c !== "Other"), ...usedCategories(all), "Other"]));
  const [custom, setCustom] = useState(false);
  const isCustom = custom || (value !== "" && !options.includes(value));
  return (
    <div>
      <select
        id={id}
        aria-invalid={!!error}
        value={isCustom ? CUSTOM : value}
        onChange={(e) => {
          if (e.target.value === CUSTOM) {
            setCustom(true);
            onChange("");
          } else {
            setCustom(false);
            onChange(e.target.value);
          }
        }}
        className={inputCls}
      >
        <option value="">Select a category</option>
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
        <option value={CUSTOM}>New category…</option>
      </select>
      {isCustom ? (
        <input
          aria-label="New category name"
          aria-invalid={!!error}
          value={value}
          maxLength={40}
          placeholder="Category name"
          onChange={(e) => {
            const t = e.target.value;
            const match = options.find((o) => o.toLowerCase() === t.trim().toLowerCase());
            onChange(match ?? t);
          }}
          className={`${inputCls} mt-2`}
        />
      ) : null}
      {error ? <p className="mt-1.5 text-[13px] text-danger">{error}</p> : null}
    </div>
  );
}

function StatusBadge({ s }: { s?: StatusMap[string] }) {
  const st = s?.state ?? "selected";
  if (st === "saving")
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary-50 px-2 py-0.5 text-[11px] font-medium text-primary">
        <span aria-hidden className="h-2.5 w-2.5 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
        Saving
      </span>
    );
  if (st === "failed")
    return <span className="inline-flex rounded-full border border-danger/25 bg-danger-50 px-2 py-0.5 text-[11px] font-medium text-danger">Failed</span>;
  return <span className="inline-flex rounded-full border border-line bg-canvas px-2 py-0.5 text-[11px] font-medium text-ink-muted">Selected, not saved yet</span>;
}

export default function DatasetUploader({
  drafts,
  onChange,
  statuses,
  takenNames = [],
  disabled = false,
  showErrors = false,
}: {
  drafts: DatasetDraft[];
  onChange: (d: DatasetDraft[]) => void;
  statuses: StatusMap;
  /** File names (lower case) the project already has. */
  takenNames?: string[];
  disabled?: boolean;
  showErrors?: boolean;
}) {
  const uid = useId();
  const input = useRef<HTMLInputElement>(null);
  const [rejected, setRejected] = useState<{ name: string; reason: string }[]>([]);
  const [over, setOver] = useState(false);

  async function add(files: File[]) {
    const taken = new Set([...takenNames, ...drafts.map((d) => d.file.name.toLowerCase())]);
    const accepted: DatasetDraft[] = [];
    const bad: { name: string; reason: string }[] = [];
    for (const f of files) {
      const key = f.name.toLowerCase();
      if (taken.has(key)) {
        bad.push({ name: f.name, reason: takenNames.includes(key) ? "This project already has a dataset with this file name. Existing datasets are not replaced." : "This file is already in the list." });
        continue;
      }
      const reason = await inspectFile(f);
      if (reason) {
        bad.push({ name: f.name, reason });
        continue;
      }
      taken.add(key);
      accepted.push({ localId: Math.random().toString(36).slice(2, 9), file: f, name: stripExt(f.name), category: "", description: "", periodFrom: "", periodTo: "", remarks: "" });
    }
    if (accepted.length) onChange([...drafts, ...accepted]);
    setRejected(bad);
  }

  const patch = (id: string, p: Partial<DatasetDraft>) => onChange(drafts.map((d) => (d.localId === id ? { ...d, ...p } : d)));
  const busy = disabled;

  return (
    <div>
      <input
        ref={input}
        id={`${uid}-files`}
        type="file"
        multiple
        accept={ACCEPT}
        disabled={busy}
        className="sr-only"
        onChange={(e) => {
          void add(Array.from(e.target.files ?? []));
          e.target.value = "";
        }}
      />
      <label
        htmlFor={`${uid}-files`}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          if (!busy) void add(Array.from(e.dataTransfer.files));
        }}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-4 py-8 text-center focus-within:outline-2 focus-within:outline-primary ${over ? "border-primary bg-primary-50" : "border-line hover:border-navy/40 hover:bg-navy-50"} ${busy ? "pointer-events-none opacity-60" : ""}`}
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6 text-navy" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V5m0 0-4 4m4-4 4 4M5 19h14" />
        </svg>
        <span className="mt-2 text-sm font-medium text-ink">Choose raw data files, or drop them here</span>
        <span className="mt-1 text-xs text-ink-muted">
          {FORMAT_LIST}. Up to {MAX_FILE_BYTES / 1024 / 1024} MB each. Shapefiles must be zipped.
        </span>
      </label>

      {rejected.length ? (
        <div role="alert" className="mt-3 rounded-lg border border-danger/30 bg-danger-50 px-4 py-3 text-sm text-danger">
          <div className="flex items-start justify-between gap-3">
            <p className="font-medium">{rejected.length === 1 ? "1 file was not added" : `${rejected.length} files were not added`}</p>
            <button type="button" onClick={() => setRejected([])} className="text-xs underline">
              Dismiss
            </button>
          </div>
          <ul className="mt-1.5 space-y-1">
            {rejected.map((r, i) => (
              <li key={i}>
                <span className="break-all font-medium">{r.name}</span>: {r.reason}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {drafts.length ? (
        <ul className="mt-4 space-y-4" aria-label="Selected datasets">
          {drafts.map((d, i) => {
            const e = showErrors ? draftErrors(d) : {};
            const st = statuses[d.localId];
            const id = `${uid}-${d.localId}`;
            return (
              <li key={d.localId} className="rounded-xl border border-line bg-surface p-4 shadow-card">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="break-all text-sm font-semibold text-ink">{d.file.name}</p>
                    <p className="mt-0.5 text-xs text-ink-muted">
                      {extOf(d.file.name).toUpperCase()} &middot; {fmtSize(d.file.size)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge s={st} />
                    <button type="button" disabled={busy} onClick={() => onChange(drafts.filter((x) => x.localId !== d.localId))} className="text-sm text-ink-muted hover:text-danger disabled:opacity-50">
                      Remove
                    </button>
                  </div>
                </div>
                {st?.state === "failed" && st.error ? (
                  <p role="alert" className="mt-2 text-[13px] text-danger">
                    {st.error}
                  </p>
                ) : null}
                <div className="mt-4 grid gap-x-4 gap-y-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor={`${id}-name`} className="mb-1.5 block text-sm font-medium text-ink">
                      Dataset name <span className="text-danger">*</span>
                    </label>
                    <input id={`${id}-name`} aria-invalid={!!e.name} value={d.name} maxLength={90} disabled={busy} onChange={(ev) => patch(d.localId, { name: ev.target.value })} className={inputCls} />
                    {e.name ? <p className="mt-1.5 text-[13px] text-danger">{e.name}</p> : null}
                  </div>
                  <div>
                    <label htmlFor={`${id}-cat`} className="mb-1.5 block text-sm font-medium text-ink">
                      Category <span className="text-danger">*</span>
                    </label>
                    <CategoryPicker id={`${id}-cat`} value={d.category} onChange={(v) => patch(d.localId, { category: v })} error={e.category} />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor={`${id}-desc`} className="mb-1.5 flex items-baseline gap-2 text-sm font-medium text-ink">
                      Short description <span className="text-xs font-normal text-ink-muted">Optional</span>
                    </label>
                    <textarea id={`${id}-desc`} rows={2} value={d.description} maxLength={300} disabled={busy} onChange={(ev) => patch(d.localId, { description: ev.target.value })} className={inputCls} />
                  </div>
                  <div className="sm:col-span-2">
                    <p className="mb-1.5 flex items-baseline gap-2 text-sm font-medium text-ink">
                      Collection period or data date <span className="text-xs font-normal text-ink-muted">Optional. Use one date for a single day.</span>
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <input type="date" aria-label="From" aria-invalid={!!e.period} value={d.periodFrom} disabled={busy} onChange={(ev) => patch(d.localId, { periodFrom: ev.target.value })} className={inputCls} />
                      <input type="date" aria-label="To" aria-invalid={!!e.period} value={d.periodTo} disabled={busy} onChange={(ev) => patch(d.localId, { periodTo: ev.target.value })} className={inputCls} />
                    </div>
                    {e.period ? <p className="mt-1.5 text-[13px] text-danger">{e.period}</p> : null}
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor={`${id}-rem`} className="mb-1.5 flex items-baseline gap-2 text-sm font-medium text-ink">
                      Remarks <span className="text-xs font-normal text-ink-muted">Optional</span>
                    </label>
                    <input id={`${id}-rem`} value={d.remarks} maxLength={300} disabled={busy} onChange={(ev) => patch(d.localId, { remarks: ev.target.value })} className={inputCls} />
                  </div>
                </div>
                <span className="sr-only">Dataset {i + 1} of {drafts.length}</span>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
