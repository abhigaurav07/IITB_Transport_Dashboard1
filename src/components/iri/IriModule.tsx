"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, Card, FieldLabel, Segmented, Tabs, type TabDef } from "./ui";
import SummaryTab from "./SummaryTab";
import ProfileTab from "./ProfileTab";
import MapTab from "./MapTab";
import DriveTab from "./DriveTab";
import DataPanel, { type Message, type PanelTab } from "./DataPanel";
import type { View } from "./view";
import { hashText, parseDatasets } from "@/lib/iri/csv";
import { buildRoutes } from "@/lib/iri/routes";
import { DEFAULT_RATING_ID, ratingById, conditionOf } from "@/lib/iri/rating";
import { fmtCh } from "@/lib/iri/format";
import type { ColorCtx } from "@/lib/iri/scale";
import type { ColorMode, Selection, UploadedFile } from "@/lib/iri/types";

const DEMO_FILES = [9, 14, 15, 18].map((d) => ({ name: `predicted_iri_driver_${d}.csv`, url: `/data/iri-demo/predicted_iri_driver_${d}.csv` }));

type MainTab = "summary" | "profile" | "map" | "drive";
const MAIN_TABS: TabDef<MainTab>[] = [
  { id: "summary", label: "Results summary" },
  { id: "profile", label: "Chainage profile" },
  { id: "map", label: "Map" },
  { id: "drive", label: "Drive-through" },
];

export default function IriModule() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const filesRef = useRef<UploadedFile[]>([]);
  const counter = useRef({ file: 1, ds: 1 });
  const [names, setNames] = useState<Record<string, string>>({});
  const [anchor, setAnchor] = useState<string | null>(null);
  const [selection, setSelection] = useState<Selection>("avg");
  const [mode, setMode] = useState<ColorMode>("value");
  const [ratingId, setRatingId] = useState(DEFAULT_RATING_ID);
  const [scale, setScale] = useState({ lo: 3.0, hi: 4.6 });
  const [cur, setCurState] = useState(0);
  const [tab, setTab] = useState<MainTab>("summary");
  const [panel, setPanel] = useState<{ open: boolean; tab: PanelTab }>({ open: false, tab: "files" });
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingDemo, setLoadingDemo] = useState(true);
  const [demoLoaded, setDemoLoaded] = useState(false);

  const routes = useMemo(() => buildRoutes(files, names), [files, names]);
  const route = useMemo(() => {
    if (!routes.length) return null;
    return routes.find((r) => r.members.some((m) => m.ds.id === anchor)) ?? routes[0];
  }, [routes, anchor]);
  const rating = useMemo(() => ratingById(ratingId), [ratingId]);
  const color: ColorCtx = useMemo(() => ({ mode, rating, lo: scale.lo, hi: scale.hi }), [mode, rating, scale]);

  const sel: Selection = route && selection !== "avg" && route.active.some((m) => m.ds.id === selection) ? selection : "avg";
  const selMember = route && sel !== "avg" ? route.active.find((m) => m.ds.id === sel) : undefined;
  const series = useMemo(() => (!route ? [] : sel === "avg" ? route.avg : (selMember?.iri ?? route.avg)), [route, sel, selMember]);
  const curSafe = route ? Math.min(cur, route.n - 1) : 0;

  const setCur = useCallback((i: number) => setCurState(Math.max(0, i)), []);

  /* ---------- ingest files ---------- */
  const ingest = useCallback((entries: { name: string; text: string }[], demo = false, quiet = false) => {
    const next = [...filesRef.current];
    const msgs: Message[] = [];
    let last: UploadedFile | null = null;
    for (const e of entries) {
      const hash = hashText(e.text);
      if (next.some((f) => f.hash === hash && f.name === e.name)) {
        msgs.push({ kind: "warn", text: `${e.name}: this file is already loaded, so it was not added again.` });
        continue;
      }
      const res = parseDatasets(e.name, e.text);
      if (res.error) {
        msgs.push({ kind: "bad", text: `${e.name}: not added, ${res.error}` });
        continue;
      }
      const fileId = counter.current.file++;
      const f: UploadedFile = {
        id: fileId,
        name: e.name,
        hash,
        include: true,
        demo,
        datasets: res.datasets.map((d) => ({ ...d, id: `d${counter.current.ds++}`, fileId, fileName: e.name })),
      };
      next.push(f);
      last = f;
      msgs.push({
        kind: res.warn.length ? "warn" : "ok",
        text: `${e.name}: added ${f.datasets.length} driver dataset${f.datasets.length === 1 ? "" : "s"} (${f.datasets.map((d) => `Driver ${d.key}, ${d.nv.toLocaleString()} values`).join("; ")}).${res.warn.length ? ` ${res.warn.join(" ")}` : ""}`,
      });
    }
    filesRef.current = next;
    setFiles(next);
    if (last) {
      setAnchor(last.datasets[0].id);
      setSelection("avg");
      setCurState(0);
    }
    if (!quiet) setMessages(msgs);
    return { msgs, last, count: next.length };
  }, []);

  const onAdd = useCallback(
    async (list: File[]) => {
      const entries: { name: string; text: string }[] = [];
      const bad: Message[] = [];
      for (const f of list) {
        if (!/\.csv$/i.test(f.name) && f.type !== "text/csv") {
          bad.push({ kind: "bad", text: `${f.name}: not added, only .csv files are accepted.` });
          continue;
        }
        try {
          entries.push({ name: f.name, text: await f.text() });
        } catch {
          bad.push({ kind: "bad", text: `${f.name}: could not be read.` });
        }
      }
      const r = ingest(entries);
      setMessages((m) => [...bad, ...m]);
      if (r.last) setMessages((m) => [...m, { kind: "ok", text: "Averages and all results were recalculated." }]);
    },
    [ingest],
  );

  const loadDemo = useCallback(async (quiet = false) => {
    try {
      const entries = await Promise.all(DEMO_FILES.map(async (d) => ({ name: d.name, text: await (await fetch(d.url)).text() })));
      ingest(entries, true, quiet);
      setDemoLoaded(true);
      if (!quiet) setMessages([{ kind: "ok", text: "Demo data loaded." }]);
    } catch {
      setMessages([{ kind: "bad", text: "The demo files could not be loaded." }]);
    }
  }, [ingest]);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (filesRef.current.length === 0 && alive) await loadDemo(true);
      if (alive) setLoadingDemo(false);
    })();
    return () => {
      alive = false;
    };
  }, [loadDemo]);

  const keepAnchor = (removeIds: Set<string>) => {
    if (!route) return;
    const keep = route.members.find((m) => !removeIds.has(m.ds.id));
    setAnchor(keep ? keep.ds.id : null);
  };
  const onToggle = (id: number) => {
    const next = filesRef.current.map((f) => (f.id === id ? { ...f, include: !f.include } : f));
    filesRef.current = next;
    setFiles(next);
  };
  const onRemove = (id: number) => {
    const f = filesRef.current.find((x) => x.id === id);
    if (!f) return;
    keepAnchor(new Set(f.datasets.map((d) => d.id)));
    const next = filesRef.current.filter((x) => x.id !== id);
    filesRef.current = next;
    setFiles(next);
    setMessages([{ kind: "ok", text: `Removed ${f.name}. Averages were recalculated.` }]);
  };
  const onRemoveAll = () => {
    filesRef.current = [];
    setFiles([]);
    setAnchor(null);
    setMessages([{ kind: "ok", text: "All files removed." }]);
  };
  const onRename = (routeId: string, name: string) => {
    const r = routes.find((x) => x.id === routeId);
    if (!r) return;
    setNames((n) => {
      const o = { ...n };
      r.members.forEach((m) => {
        if (name) o[m.ds.id] = name;
        else delete o[m.ds.id];
      });
      return o;
    });
  };
  const selectRoute = useCallback(
    (id: string) => {
      const r = routes.find((x) => x.id === id);
      if (!r) return;
      setAnchor(r.members[0].ds.id);
      setSelection("avg");
      setCurState(0);
    },
    [routes],
  );

  const openPanel = useCallback((t: PanelTab) => setPanel({ open: true, tab: t }), []);

  const view: View | null = useMemo(() => {
    if (!route || route.active.length === 0) return null;
    return {
      route,
      routes,
      rating,
      color,
      selection: sel,
      series,
      cur: curSafe,
      setCur,
      selectRoute,
      openPanel,
      selectedLabel: selMember ? selMember.label : "All drivers (average)",
    };
  }, [route, routes, rating, color, sel, series, curSafe, setCur, selectRoute, openPanel, selMember]);

  const download = () => {
    if (!route) return;
    const act = route.active;
    const head = ["block_id", "start_lat", "start_lon", "end_lat", "end_lon", "start_chainage", "end_chainage", "length_m", "n_drivers", "drivers"]
      .concat(act.map((m) => `iri_${m.label.replace(/[^A-Za-z0-9]+/g, "_")}`), ["avg_iri", "min_iri", "max_iri", "condition"]);
    const rows = [head.join(",")];
    for (let i = 0; i < route.n; i++) {
      const last = i === route.n - 1;
      const who = act.filter((m) => m.iri[i] != null).map((m) => m.label);
      rows.push(
        [i, route.lat[i], route.lon[i], last ? "" : route.lat[i + 1], last ? "" : route.lon[i + 1], fmtCh(route.km[i]), last ? "" : fmtCh(route.km[i + 1]), last ? "" : ((route.km[i + 1] - route.km[i]) * 1000).toFixed(1), route.nd[i], `"${who.join("; ")}"`]
          .concat(
            act.map((m) => (m.iri[i] == null ? "" : (m.iri[i] as number).toFixed(4))),
            [route.avg[i] == null ? "" : (route.avg[i] as number).toFixed(4), route.min[i] == null ? "" : (route.min[i] as number).toFixed(4), route.max[i] == null ? "" : (route.max[i] as number).toFixed(4), conditionOf(route.avg[i], rating) ?? ""],
          )
          .join(","),
      );
    }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([rows.join("\n")], { type: "text/csv" }));
    a.download = `IRI_block_table_${route.name.replace(/[^A-Za-z0-9]+/g, "_")}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const goBlock = (i: number) => {
    setCur(i);
    setTab("drive");
  };

  /* ---------- render ---------- */
  const names2 = route ? route.active.map((m) => m.label.replace(/^Driver /, "")).join(", ") : "";
  const excluded = route ? route.members.length - route.active.length : 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Module 1 · Road roughness</p>
          <h1 className="mt-1 text-2xl font-semibold text-ink lg:text-3xl">Predicted IRI assessment</h1>
          <p className="mt-2 max-w-3xl text-sm text-ink-muted">
            Predicted International Roughness Index (IRI) for every block of about 50 m along a route. Each block shows the average of all drivers who covered it. Add driver files under Data input and every result updates automatically.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button variant="primary" onClick={() => openPanel("files")} ariaHaspopup="dialog">
            Data input
            {files.length ? <span className="rounded-full bg-white/20 px-1.5 text-[11px] font-semibold tabular-nums">{files.length}</span> : null}
          </Button>
          <Button onClick={() => openPanel("basis")} ariaHaspopup="dialog" disabled={!route}>Rating basis</Button>
        </div>
      </div>

      {loadingDemo && !route ? (
        <Card><p className="py-8 text-center text-sm text-ink-muted">Loading data</p></Card>
      ) : !route ? (
        <div className="flex flex-col items-center rounded-xl border border-dashed border-line bg-surface px-6 py-16 text-center">
          <h2 className="text-base font-semibold text-ink">No data loaded</h2>
          <p className="mt-1.5 max-w-lg text-sm text-ink-muted">
            Upload one CSV file per driver trip. Files that follow the same reference points are grouped into one route automatically, and the average IRI of every 50 m block is calculated from all files of that route.
          </p>
          <div className="mt-5 flex gap-2">
            <Button variant="primary" onClick={() => openPanel("files")}>Upload CSV files</Button>
            {!demoLoaded || files.length === 0 ? <Button onClick={() => loadDemo()}>Load demo data</Button> : null}
          </div>
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-primary/20 bg-primary-50 px-4 py-3" aria-live="polite">
            <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">Showing</span>
              <span className="text-base font-semibold text-ink">{route.name}</span>
              <span className="text-sm tabular-nums text-ink-muted">
                {route.km[route.n - 1].toFixed(1)} km · chainage 0+000 to {fmtCh(route.km[route.n - 1])} · {(route.n - 1).toLocaleString()} blocks of about 50 m
              </span>
            </div>
            {route.active.length ? (
              <p className="mt-1 text-sm text-ink-muted">
                Every block value is the <b className="text-ink">average predicted IRI of {route.active.length} driver{route.active.length === 1 ? "" : "s"}</b> ({names2}) who covered that block.
                {excluded ? ` ${excluded} file${excluded === 1 ? "" : "s"} excluded.` : ""}{" "}
                <button type="button" onClick={() => openPanel("files")} className="font-medium text-primary hover:underline">Add or remove files</button>
              </p>
            ) : (
              <p className="mt-1 text-sm text-ink-muted">
                No file of this route is included in the average. Tick at least one file in{" "}
                <button type="button" onClick={() => openPanel("files")} className="font-medium text-primary hover:underline">Data input</button> to see results.
              </p>
            )}
            {route.refs[0] > 0 ? (
              <p className="mt-1 text-xs text-ink-muted">
                Chainage counts from reference point {route.refs[0]}, the first point in the files loaded for this route. Removing a file that holds earlier points moves the origin.
              </p>
            ) : null}
          </div>

          {view ? (
            <>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-xl border border-line bg-surface px-4 py-3">
                {routes.length > 1 ? (
                  <label className="flex items-center gap-2.5">
                    <FieldLabel>Route</FieldLabel>
                    <select value={route.id} onChange={(e) => selectRoute(e.target.value)} className="rounded-lg border border-line bg-surface px-2.5 py-1.5 text-sm">
                      {routes.map((r) => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </label>
                ) : null}
                <div className="flex items-center gap-2.5">
                  <FieldLabel>Driver</FieldLabel>
                  <Segmented<string>
                    label="Driver"
                    value={sel}
                    onChange={(v) => setSelection(v)}
                    options={[{ id: "avg", label: "All drivers (average)", swatch: "#0f172a" }, ...route.active.map((m) => ({ id: m.ds.id, label: m.label, swatch: m.color }))]}
                  />
                </div>
                <div className="flex items-center gap-2.5">
                  <FieldLabel>Colour by</FieldLabel>
                  <Segmented<ColorMode>
                    label="Colour by"
                    value={mode}
                    onChange={setMode}
                    options={[
                      { id: "value", label: "IRI value" },
                      { id: "class", label: "Condition class" },
                    ]}
                  />
                </div>
              </div>

              <div>
                <Tabs tabs={MAIN_TABS} value={tab} onChange={setTab} idPrefix="iri-main" />
                <div role="tabpanel" id={`iri-main-panel-${tab}`} aria-labelledby={`iri-main-tab-${tab}`} className="pt-5">
                  {tab === "summary" ? <SummaryTab v={view} onOpenBasis={() => openPanel("basis")} onGoBlock={goBlock} /> : null}
                  {tab === "profile" ? <ProfileTab v={view} /> : null}
                  {tab === "map" ? <MapTab v={view} /> : null}
                  {tab === "drive" ? <DriveTab v={view} /> : null}
                </div>
              </div>
            </>
          ) : null}
        </>
      )}

      <DataPanel
        open={panel.open}
        tab={panel.tab}
        onTab={(t) => setPanel((p) => ({ ...p, tab: t }))}
        onClose={() => setPanel((p) => ({ ...p, open: false }))}
        files={files}
        routes={routes}
        view={view}
        messages={messages}
        onAdd={onAdd}
        onToggle={onToggle}
        onRemove={onRemove}
        onRemoveAll={onRemoveAll}
        onLoadDemo={() => loadDemo()}
        demoAvailable={!files.some((f) => f.demo)}
        onRename={onRename}
        ratingId={ratingId}
        onRating={setRatingId}
        lo={scale.lo}
        hi={scale.hi}
        onScale={(lo, hi) => setScale({ lo, hi })}
        onDownload={download}
      />
    </div>
  );
}
