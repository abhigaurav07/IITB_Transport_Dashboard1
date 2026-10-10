"use client";

import { useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import { Button, FieldLabel, Tabs, td, tdNum, th, thNum } from "./ui";
import { CoverageChart } from "./CoverageChart";
import type { View } from "./view";
import { CloseIcon } from "@/components/icons";
import type { Route, UploadedFile } from "@/lib/iri/types";
import { RATING_GROUPS } from "@/lib/iri/rating";
import { computeChecks } from "@/lib/iri/checks";
import { driverStats } from "@/lib/iri/stats";
import { fmtCh, fmtDate } from "@/lib/iri/format";

export type PanelTab = "files" | "sum" | "basis";
export interface Message {
  kind: "ok" | "warn" | "bad";
  text: string;
}

const TABS = [
  { id: "files" as const, label: "Data files and routes" },
  { id: "sum" as const, label: "Driver summary and coverage" },
  { id: "basis" as const, label: "Rating basis and checks" },
];
const TITLE: Record<PanelTab, string> = { files: "Data input", sum: "Driver summary and coverage", basis: "Rating basis and checks" };
const MSG_STYLE = { ok: "border-success", warn: "border-amber-400", bad: "border-danger" };

interface Props {
  open: boolean;
  tab: PanelTab;
  onTab: (t: PanelTab) => void;
  onClose: () => void;
  files: UploadedFile[];
  routes: Route[];
  view: View | null;
  messages: Message[];
  onAdd: (files: File[]) => void;
  onToggle: (id: number) => void;
  onRemove: (id: number) => void;
  onRemoveAll: () => void;
  onLoadDemo: () => void;
  demoAvailable: boolean;
  onRename: (routeId: string, name: string) => void;
  ratingId: string;
  onRating: (id: string) => void;
  lo: number;
  hi: number;
  onScale: (lo: number, hi: number) => void;
  onDownload: () => void;
}

export default function DataPanel(p: Props) {
  const panel = useRef<HTMLElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const opener = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!p.open) return;
    opener.current = document.activeElement as HTMLElement | null;
    const t = window.setTimeout(() => closeBtn.current?.focus(), 40);
    document.body.style.overflow = "hidden";
    return () => {
      window.clearTimeout(t);
      document.body.style.overflow = "";
      opener.current?.focus?.();
    };
  }, [p.open]);

  useEffect(() => {
    if (!p.open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        p.onClose();
        return;
      }
      if (e.key !== "Tab" || !panel.current) return;
      const f = [...panel.current.querySelectorAll<HTMLElement>("button, select, input, [tabindex='0']")].filter((x) => !x.hasAttribute("disabled") && x.offsetParent !== null);
      if (!f.length) return;
      const a = f[0];
      const z = f[f.length - 1];
      if (!panel.current.contains(document.activeElement)) {
        a.focus();
        e.preventDefault();
      } else if (e.shiftKey && document.activeElement === a) {
        z.focus();
        e.preventDefault();
      } else if (!e.shiftKey && document.activeElement === z) {
        a.focus();
        e.preventDefault();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [p.open, p]);

  return (
    <>
      <div
        className={`m-0! fixed inset-0 z-[2000] bg-slate-950/50 transition-opacity duration-200 ${p.open ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={p.onClose}
        aria-hidden
      />
      <aside
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="iri-panel-title"
        aria-hidden={!p.open}
        className={`m-0! fixed inset-y-0 right-0 z-[2001] flex w-full max-w-[960px] flex-col border-l border-line bg-canvas shadow-2xl transition-transform duration-200 motion-reduce:transition-none ${p.open ? "translate-x-0" : "invisible translate-x-full"}`}
      >
        <div className="flex items-center justify-between border-b border-line bg-surface px-6 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">Module 1</p>
            <h2 id="iri-panel-title" className="text-lg font-semibold text-ink">{TITLE[p.tab]}</h2>
          </div>
          <button ref={closeBtn} type="button" onClick={p.onClose} aria-label="Close panel" className="rounded-lg border border-line p-2 text-ink-muted hover:bg-canvas hover:text-ink">
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="bg-surface px-6">
          <Tabs tabs={TABS} value={p.tab} onChange={p.onTab} idPrefix="iri-panel" />
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {p.tab === "files" ? <FilesTab {...p} /> : null}
          {p.tab === "sum" && p.view ? <SummaryPanel v={p.view} /> : null}
          {p.tab === "basis" && p.view ? <BasisPanel {...p} v={p.view} /> : null}
          {(p.tab === "sum" || p.tab === "basis") && !p.view ? <p className="text-sm text-ink-muted">Load at least one file and include it in the average to see this.</p> : null}
        </div>
      </aside>
    </>
  );
}

/* ---------------- files ---------------- */
function FilesTab(p: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const drop = (e: DragEvent) => {
    e.preventDefault();
    setOver(false);
    const l = Array.from(e.dataTransfer.files ?? []);
    if (l.length) p.onAdd(l);
  };
  const routeNames = (f: UploadedFile) =>
    [...new Set(f.datasets.map((d) => p.routes.find((r) => r.members.some((m) => m.ds.id === d.id))?.name).filter(Boolean))].join(", ");
  return (
    <div className="space-y-6">
      <div
        onDragEnter={(e) => { e.preventDefault(); setOver(true); }}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={drop}
        className={`rounded-xl border-2 border-dashed px-6 py-7 text-center transition-colors ${over ? "border-primary bg-primary-50" : "border-slate-300 bg-surface"}`}
      >
        <input
          ref={input}
          type="file"
          accept=".csv,text/csv"
          multiple
          hidden
          onChange={(e) => {
            const l = Array.from(e.target.files ?? []);
            e.target.value = "";
            if (l.length) p.onAdd(l);
          }}
        />
        <p className="text-sm font-semibold text-ink">Upload CSV files or drop them here</p>
        <p className="mx-auto mt-1 max-w-xl text-xs text-ink-muted">
          One file per driver trip. Required columns: ref_idx, driver_key, lat, lon, predicted_iri. Optional: utc_timestamp, avg_speed_mps. Files are read in your browser and are not sent anywhere.
        </p>
        <div className="mt-4">
          <Button variant="primary" onClick={() => input.current?.click()}>Choose files</Button>
        </div>
      </div>

      <div aria-live="polite" className="space-y-1.5">
        {p.messages.map((m, i) => (
          <div key={i} className={`rounded-lg border-l-4 bg-surface px-3 py-2 text-[13px] text-ink ${MSG_STYLE[m.kind]}`}>{m.text}</div>
        ))}
      </div>

      <section>
        <h3 className="text-sm font-semibold text-ink">Files loaded</h3>
        <p className="mt-0.5 text-xs text-ink-muted">
          Excluding a file keeps it listed but removes it from the average. Removing a file deletes it. Averages, class shares, profile, map and drive-through update at once.
        </p>
        <div className="mt-3 overflow-x-auto rounded-xl border border-line bg-surface">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-line">
                <th className={th}>File</th>
                <th className={th}>Driver</th>
                <th className={th}>Route</th>
                <th className={th}>Date (UTC)</th>
                <th className={thNum}>Values</th>
                <th className={th}>In average</th>
                <th className={th} />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {p.files.length === 0 ? (
                <tr><td className={`${td} text-ink-muted`} colSpan={7}>No files loaded.</td></tr>
              ) : (
                p.files.map((f) => (
                  <tr key={f.id} className={f.include ? "" : "bg-slate-50 text-ink-muted"}>
                    <td className={`${td} max-w-[220px] break-all`}>
                      {f.name}
                      {f.demo ? <span className="ml-2 rounded-full border border-line px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-ink-muted">demo</span> : null}
                    </td>
                    <td className={td}>{f.datasets.map((d) => d.key).join(", ")}</td>
                    <td className={td}>{routeNames(f)}</td>
                    <td className={`${td} whitespace-nowrap`}>{f.datasets.find((d) => d.date)?.date ? fmtDate(f.datasets.find((d) => d.date)!.date!) : "not given"}</td>
                    <td className={tdNum}>{f.datasets.reduce((a, d) => a + d.nv, 0).toLocaleString()}</td>
                    <td className={td}>
                      <label className="inline-flex cursor-pointer items-center gap-2 text-[13px]">
                        <input type="checkbox" checked={f.include} onChange={() => p.onToggle(f.id)} aria-label={`Include ${f.name} in the average`} className="h-4 w-4 accent-primary" />
                        {f.include ? "Included" : "Excluded"}
                      </label>
                    </td>
                    <td className={td}>
                      <Button size="sm" variant="danger" onClick={() => p.onRemove(f.id)} ariaLabel={`Remove ${f.name}`}>Remove</Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button onClick={p.onRemoveAll} disabled={!p.files.length}>Remove all files</Button>
          {p.demoAvailable ? <Button onClick={p.onLoadDemo}>Load demo data</Button> : null}
        </div>
      </section>

      {p.routes.length ? (
        <section>
          <h3 className="text-sm font-semibold text-ink">Routes detected</h3>
          <p className="mt-0.5 text-xs text-ink-muted">Files whose reference points coincide are placed on the same route. You can rename a route.</p>
          <div className="mt-3 overflow-x-auto rounded-xl border border-line bg-surface">
            <table className="w-full min-w-[560px]">
              <thead>
                <tr className="border-b border-line">
                  <th className={th}>Route name</th>
                  <th className={thNum}>Length</th>
                  <th className={thNum}>Reference points</th>
                  <th className={th}>Drivers</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {p.routes.map((r) => (
                  <tr key={r.id}>
                    <td className={td}><RouteName key={`${r.id}:${r.name}`} route={r} onRename={p.onRename} /></td>
                    <td className={tdNum}>{r.km[r.n - 1].toFixed(1)} km</td>
                    <td className={tdNum}>{r.n.toLocaleString()}</td>
                    <td className={td}>
                      <div className="flex flex-wrap gap-x-4 gap-y-1">
                        {r.members.map((m) => (
                          <span key={m.ds.id} className="inline-flex items-center gap-1.5 text-[13px]">
                            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: m.color }} aria-hidden />
                            {m.label}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}

function RouteName({ route, onRename }: { route: Route; onRename: (id: string, n: string) => void }) {
  const [val, setVal] = useState(route.name);
  return (
    <input
      value={val}
      onChange={(e) => setVal(e.target.value)}
      onBlur={() => val.trim() !== route.name && onRename(route.id, val.trim())}
      onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
      aria-label="Name of route"
      className="w-full min-w-[9rem] rounded-lg border border-line bg-surface px-2.5 py-1.5 text-sm"
    />
  );
}

/* ---------------- driver summary + coverage ---------------- */
function SummaryPanel({ v }: { v: View }) {
  const { route, rating } = v;
  const stats = useMemo(() => route.active.map((m) => driverStats(route, m, rating)), [route, rating]);

  return (
    <div className="space-y-6">
      <section>
        <h3 className="text-sm font-semibold text-ink">{route.name}: {route.active.length} driver file{route.active.length === 1 ? "" : "s"} included in the average</h3>
        <p className="mt-0.5 text-xs text-ink-muted">Mean, median and maximum are plain arithmetic values over the blocks each driver covered.</p>
        <div className="mt-3 overflow-x-auto rounded-xl border border-line bg-surface">
          <table className="w-full min-w-[760px]">
            <thead>
              <tr className="border-b border-line">
                <th className={th}>Driver</th>
                <th className={th}>Date (UTC)</th>
                <th className={thNum}>Joined route at</th>
                <th className={thNum}>Values reported</th>
                <th className={thNum}>Missing in own range</th>
                <th className={thNum}>Mean IRI</th>
                <th className={thNum}>Median</th>
                <th className={thNum}>Max</th>
                <th className={thNum}>Poor (above {rating.fair.toFixed(2)})</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {stats.map((s) => (
                <tr key={s.member.ds.id}>
                  <td className={td}>
                    <span className="mr-2 inline-block h-2.5 w-2.5 rounded-sm align-middle" style={{ background: s.member.color }} aria-hidden />
                    {s.member.label}
                  </td>
                  <td className={`${td} whitespace-nowrap`}>{s.date}</td>
                  <td className={tdNum}>{fmtCh(s.startKm)}</td>
                  <td className={tdNum}>{s.n.toLocaleString()}</td>
                  <td className={tdNum}>{s.missing}</td>
                  <td className={tdNum}>{s.mean.toFixed(2)}</td>
                  <td className={tdNum}>{s.median.toFixed(2)}</td>
                  <td className={tdNum}>{s.max.toFixed(2)}</td>
                  <td className={tdNum}>{(100 * s.poor).toFixed(0)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section>
        <h3 className="text-sm font-semibold text-ink">Coverage by block</h3>
        <p className="mt-0.5 text-xs text-ink-muted">One row per driver, one cell per block along the chainage. Grey cells were not driven. Hover to move the selected block.</p>
        <div className="mt-3">
          <CoverageChart v={v} />
        </div>
      </section>
    </div>
  );
}

/* ---------------- rating basis + checks ---------------- */
function BasisPanel(p: Props & { v: View }) {
  const { v } = p;
  const checks = useMemo(() => computeChecks(v.route, v.rating), [v.route, v.rating]);
  const [lo, setLo] = useState(String(p.lo));
  const [hi, setHi] = useState(String(p.hi));
  const commit = () => {
    const a = parseFloat(lo);
    const b = parseFloat(hi);
    if (Number.isFinite(a) && Number.isFinite(b) && b > a + 0.1) p.onScale(a, b);
    else {
      setLo(String(p.lo));
      setHi(String(p.hi));
    }
  };
  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-line bg-surface p-5">
        <label className="block">
          <FieldLabel>Road class (IRC:SP:16-2019)</FieldLabel>
          <select value={p.ratingId} onChange={(e) => p.onRating(e.target.value)} className="mt-1.5 block w-full max-w-xl rounded-lg border border-line bg-surface px-3 py-2 text-sm">
            {RATING_GROUPS.map((g) => (
              <optgroup key={g.table} label={`${g.group} (${g.table})`}>
                {g.options.map((o) => (
                  <option key={o.id} value={o.id}>{o.label} · Good &lt; {o.good.toFixed(2)}, Poor &gt; {o.fair.toFixed(2)}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <p className="mt-2 text-xs text-ink-muted">
          Condition classes follow IRC:SP:16-2019: Good below {v.rating.good.toFixed(2)}, Fair {v.rating.good.toFixed(2)} to {v.rating.fair.toFixed(2)}, Poor above {v.rating.fair.toFixed(2)}. The default is Table 3.1, bituminous Expressway, NH and SH roads. Changing the class updates every colour, class share and table. The limits were read from the standard through a text extraction, so please verify them against your copy.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <FieldLabel>Colour scale, IRI value</FieldLabel>
          <input value={lo} onChange={(e) => setLo(e.target.value)} onBlur={commit} size={4} aria-label="Lowest IRI of the colour scale" className="w-20 rounded-lg border border-line px-2.5 py-1.5 text-sm tabular-nums" />
          <span className="text-sm text-ink-muted">to</span>
          <input value={hi} onChange={(e) => setHi(e.target.value)} onBlur={commit} size={4} aria-label="Highest IRI of the colour scale" className="w-20 rounded-lg border border-line px-2.5 py-1.5 text-sm tabular-nums" />
        </div>
        <div className="mt-4">
          <Button onClick={p.onDownload}>Download block table of the shown route (CSV)</Button>
        </div>
      </section>
      <section>
        <h3 className="text-sm font-semibold text-ink">Data checks for the shown route</h3>
        <div className="mt-3 overflow-x-auto rounded-xl border border-line bg-surface">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-line">
                <th className={th}>Check</th>
                <th className={th}>What the data shows</th>
                <th className={th}>Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {checks.map((c) => (
                <tr key={c.title}>
                  <td className={`${td} w-56 align-top`}>{c.title}</td>
                  <td className={`${td} align-top text-ink-muted`}>{c.detail}</td>
                  <td className={`${td} align-top`}>
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${c.status === "OK" ? "border-success/20 bg-success-50 text-success" : "border-warning/25 bg-warning-50 text-warning"}`}>
                      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
