"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import ProfileChart from "./ProfileChart";
import MapLegend from "./MapLegend";
import { HistogramCard, ScatterCard } from "./CompareCharts";
import { Card, ConditionBadge, Segmented, td, tdNum, th, thNum } from "@/components/iri/ui";
import StatCard from "@/components/ui/StatCard";
import { CLASSES, MIN_COVERAGE, compareStats, type Alignment } from "@/lib/atal/align";
import { MAP_HI, MAP_LO, MODEL_COLOR, NSV_COLOR } from "@/lib/atal/nsv";
import { chM, downloadCsv, rangeLabel, signed } from "@/lib/atal/format";
import { conditionOf, DEFAULT_RATING_ID, ratingById, ratingName } from "@/lib/iri/rating";
import { mix, rampRgb, rgbCss } from "@/lib/iri/scale";

const RouteMap = dynamic(() => import("./RouteMap"), {
  ssr: false,
  loading: () => <div className="grid h-full place-items-center text-sm text-ink-muted">Loading map</div>,
});

const POOR = "#b91c1c";
const GOOD = "#15803d";
const DIFF_RANGE = 3;
const LOW = [29, 78, 216];
const MID = [241, 245, 249];
const HIGH = [185, 28, 28];
const diffColor = (d: number) => {
  const t = Math.min(1, Math.abs(d) / DIFF_RANGE);
  return rgbCss(mix(MID, d >= 0 ? HIGH : LOW, t));
};

export default function CompareTab({ al }: { al: Alignment }) {
  const rating = ratingById(DEFAULT_RATING_ID);
  const nm = ratingName(rating.id);
  const [cur, setCur] = useState(() => Math.max(0, al.rows.findIndex((r) => r.model != null && r.coverage >= MIN_COVERAGE)));
  const [skipDoubtful, setSkipDoubtful] = useState(false);
  const [view, setView] = useState<"side" | "diff">("side");
  const rows = al.rows;
  const n = rows.length;
  const c = Math.min(cur, n - 1);

  const used = useMemo(() => rows.map((r) => r.model != null && r.coverage >= MIN_COVERAGE && !(skipDoubtful && r.uncertain)), [rows, skipDoubtful]);
  const nsvV = useMemo(() => rows.map((r) => r.nsv.avg), [rows]);
  const modelV = useMemo(() => rows.map((r, i) => (used[i] ? (r.model as number) : null)), [rows, used]);
  const diffV = useMemo(() => rows.map((r, i) => (used[i] ? (r.model as number) - r.nsv.avg : null)), [rows, used]);
  const starts = useMemo(() => rows.map((r) => r.nsv.startM), [rows]);
  const ends = useMemo(() => rows.map((r) => r.nsv.endM), [rows]);
  const stats = useMemo(() => compareStats(rows.flatMap((r, i) => (used[i] ? [{ nsv: r.nsv.avg, model: r.model as number }] : [])), rating), [rows, used, rating]);
  const doubtful = useMemo(() => rows.filter((r) => r.uncertain && r.model != null && r.coverage >= MIN_COVERAGE).length, [rows]);

  const segs = useMemo(() => rows.map((r) => ({ a: [r.nsv.lat, r.nsv.lon] as [number, number], b: [r.nsv.endLat, r.nsv.endLon] as [number, number] })), [rows]);
  const nsvColors = useMemo(() => rows.map((r) => rgbCss(rampRgb(r.nsv.avg, MAP_LO, MAP_HI))), [rows]);
  const modelColors = useMemo(() => modelV.map((v) => (v == null ? null : rgbCss(rampRgb(v, MAP_LO, MAP_HI)))), [modelV]);
  const diffColors = useMemo(() => diffV.map((v) => (v == null ? null : diffColor(v))), [diffV]);
  const flags = useMemo(() => rows.map((r) => r.uncertain), [rows]);

  const panels = useMemo(
    () => [
      {
        height: 250,
        kind: "abs" as const,
        label: "IRI (m/km)",
        thresholds: [[rating.good, GOOD], [rating.fair, POOR]] as [number, string][],
        series: [
          { key: "model", color: MODEL_COLOR, values: modelV },
          { key: "nsv", color: NSV_COLOR, values: nsvV },
        ],
      },
      { height: 120, kind: "diff" as const, label: "Model minus NSV", series: [{ key: "diff", color: MODEL_COLOR, values: diffV, kind: "bars" as const }] },
    ],
    [rating, modelV, nsvV, diffV],
  );
  const scatter = useMemo(() => rows.flatMap((r, i) => (used[i] ? [{ i, x: r.nsv.avg, y: r.model as number, uncertain: r.uncertain }] : [])), [rows, used]);
  const hist = useMemo(() => ({ nsv: rows.flatMap((r, i) => (used[i] ? [r.nsv.avg] : [])), model: rows.flatMap((r, i) => (used[i] ? [r.model as number] : [])) }), [rows, used]);

  const r = rows[c];
  const sh = (v: number | null) => (v == null ? "n/a" : `${v >= 0 ? "+" : "−"}${(Math.abs(v) / 1000).toFixed(2)} km`);

  if (!stats) {
    return <div className="rounded-xl border border-line bg-surface p-6 text-sm text-ink-muted">The two files do not overlap on the same stretch of road, so there is nothing to compare.</div>;
  }
  const modelCls = r.model != null ? conditionOf(r.model, rating) : null;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-3">
        <p className="text-sm text-ink">
          Model blocks are placed on the NSV route by GPS position. NSV chainage = model chainage {sh(al.startShiftM)} at the start and {sh(al.endShiftM)} at the end.
        </p>
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-ink">
          <input type="checkbox" className="h-4 w-4 accent-primary" checked={skipDoubtful} onChange={(e) => setSkipDoubtful(e.target.checked)} />
          Leave out {doubtful} doubtful blocks
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Blocks compared" value={`${stats.n}`} sublabel={`of ${n} NSV blocks · ${doubtful} lean on a model block with a doubtful length`} />
        <StatCard label="Mean difference (model − NSV)" value={signed(stats.bias)} tone={Math.abs(stats.bias) > 1 ? "warning" : "primary"} sublabel={`NSV mean ${stats.meanNsv.toFixed(2)} · model mean ${stats.meanModel.toFixed(2)}`} />
        <StatCard label="Mean absolute error" value={stats.mae.toFixed(2)} sublabel={`Root mean square error ${stats.rmse.toFixed(2)} m/km`} />
        <StatCard label="Correlation" value={stats.pearson == null ? "none" : stats.pearson.toFixed(2)} sublabel={`Pearson r · rank correlation ${stats.spearman == null ? "none" : stats.spearman.toFixed(2)}`} />
        <StatCard label="Spread (std. deviation)" value={`${stats.sdModel.toFixed(2)} vs ${stats.sdNsv.toFixed(2)}`} sublabel={`Model vs NSV · model ranges only ${stats.minModel.toFixed(2)} to ${stats.maxModel.toFixed(2)}`} />
        <StatCard label="Same condition class" value={`${(100 * stats.agree).toFixed(0)}%`} sublabel={`IRC:SP:16-2019 ${nm.table}: Good below ${rating.good.toFixed(2)}, Poor above ${rating.fair.toFixed(2)}`} />
      </div>

      <ProfileChart
        title="Model and NSV along the NSV chainage"
        starts={starts}
        ends={ends}
        panels={panels}
        cur={c}
        setCur={setCur}
        ariaLabel="Model IRI and NSV IRI of each 50 m block along the NSV chainage, with their difference"
        legend={
          <>
            <span className="inline-flex items-center gap-2"><span className="h-[3px] w-5 rounded bg-ink" />NSV</span>
            <span className="inline-flex items-center gap-2"><span className="h-[3px] w-5 rounded" style={{ background: MODEL_COLOR }} />Model</span>
            <span className="inline-flex items-center gap-2"><span className="h-2.5 w-3 rounded-sm" style={{ background: MODEL_COLOR }} />Model higher</span>
            <span className="inline-flex items-center gap-2"><span className="h-2.5 w-3 rounded-sm" style={{ background: "#1d4ed8" }} />Model lower</span>
            <span className="inline-flex items-center gap-2"><span className="w-5 border-t-2 border-dashed" style={{ borderColor: POOR }} />Poor above {rating.fair.toFixed(2)}</span>
            <span className="inline-flex items-center gap-2"><span className="w-5 border-t-2 border-dashed" style={{ borderColor: GOOD }} />Good below {rating.good.toFixed(2)}</span>
          </>
        }
      />

      <Card
        title="Maps"
        action={
          <Segmented
            label="Map view"
            value={view}
            onChange={setView}
            options={[
              { id: "side", label: "Side by side" },
              { id: "diff", label: "Difference" },
            ]}
          />
        }
      >
        {view === "side" ? (
          <>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {[
                { t: "NSV", colors: nsvColors, k: "nsv" },
                { t: "Model, placed on the NSV route", colors: modelColors, k: "model" },
              ].map((m) => (
                <div key={m.k}>
                  <p className="mb-2 text-sm font-semibold text-ink">{m.t}</p>
                  <div className="h-[28rem] overflow-hidden rounded-lg border border-line bg-slate-100">
                    <RouteMap segs={segs} colors={m.colors} flags={m.k === "model" ? flags : undefined} cur={c} setCur={setCur} syncKey="atal-compare" startLabel={`Start, NSV chainage ${chM(starts[0])}`} endLabel={`End, NSV chainage ${chM(ends[n - 1])}`} ariaLabel={`Route map coloured by ${m.t} IRI`} />
                  </div>
                </div>
              ))}
            </div>
            <MapLegend note="Same colour scale on both maps. Red halo: doubtful block length. The maps pan and zoom together." />
          </>
        ) : (
          <>
            <div className="h-[34rem] overflow-hidden rounded-lg border border-line bg-slate-100">
              <RouteMap segs={segs} colors={diffColors} cur={c} setCur={setCur} startLabel={`Start, NSV chainage ${chM(starts[0])}`} endLabel={`End, NSV chainage ${chM(ends[n - 1])}`} ariaLabel="Route map coloured by model minus NSV IRI" />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-ink-muted">
              <span className="inline-flex items-center gap-2">
                <span>Model lower by {DIFF_RANGE} or more</span>
                <span className="h-2.5 w-44 rounded-full" style={{ background: `linear-gradient(90deg, ${rgbCss(LOW)}, ${rgbCss(MID)}, ${rgbCss(HIGH)})` }} aria-hidden />
                <span>Model higher by {DIFF_RANGE} or more</span>
              </span>
            </div>
          </>
        )}
      </Card>

      <Card title="Selected block">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-line p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">NSV</p>
            <div className="mt-2 flex items-center gap-3">
              <span className="text-3xl font-semibold tabular-nums text-ink">{r.nsv.avg.toFixed(2)}</span>
              <ConditionBadge c={conditionOf(r.nsv.avg, rating)} />
            </div>
            <p className="mt-1 text-xs text-ink-muted">Left {r.nsv.lwp.toFixed(2)} · right {r.nsv.rwp.toFixed(2)}</p>
            <p className="mt-2 text-sm tabular-nums text-ink">NSV chainage {rangeLabel(r.nsv.startM, r.nsv.endM)}</p>
          </div>
          <div className="rounded-lg border border-line p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Model</p>
            {r.model != null ? (
              <>
                <div className="mt-2 flex items-center gap-3">
                  <span className="text-3xl font-semibold tabular-nums" style={{ color: MODEL_COLOR }}>{r.model.toFixed(2)}</span>
                  <ConditionBadge c={modelCls} />
                </div>
                <p className="mt-1 text-xs text-ink-muted">Covers {(100 * r.coverage).toFixed(0)}% of this block</p>
                <p className="mt-2 text-sm tabular-nums text-ink">Model chainage {r.fromM != null && r.toM != null ? rangeLabel(r.fromM, r.toM) : "n/a"}</p>
              </>
            ) : (
              <p className="mt-3 text-sm text-ink-muted">The model file has no block here.</p>
            )}
          </div>
          <div className="rounded-lg border border-line p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Difference</p>
            {r.model != null ? (
              <>
                <p className="mt-2 text-3xl font-semibold tabular-nums text-ink">{signed(r.model - r.nsv.avg)}</p>
                <p className="mt-1 text-xs text-ink-muted">Model minus NSV · {conditionOf(r.nsv.avg, rating) === modelCls ? "same class" : "different class"}</p>
                {r.uncertain ? <p className="mt-2 text-sm font-medium text-danger">Doubtful: placed using a model block with a doubtful length</p> : null}
              </>
            ) : (
              <p className="mt-3 text-sm text-ink-muted">Nothing to compare.</p>
            )}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <ScatterCard points={scatter} cur={c} setCur={setCur} />
        <HistogramCard nsv={hist.nsv} model={hist.model} />
      </div>

      <Card title="Agreement of condition class" subtitle="Number of blocks. Rows are what NSV says, columns are what the model says.">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] border-separate border-spacing-1 text-sm">
            <thead>
              <tr>
                <th className={th} />
                {CLASSES.map((k) => (
                  <th key={k} className={`${thNum} text-center`}>Model: {k}</th>
                ))}
                <th className={thNum}>NSV total</th>
              </tr>
            </thead>
            <tbody>
              {CLASSES.map((rk, a) => {
                const tot = stats.matrix[a].reduce((p, q) => p + q, 0);
                return (
                  <tr key={rk}>
                    <th className={th}>NSV: {rk}</th>
                    {CLASSES.map((ck, b) => {
                      const v = stats.matrix[a][b];
                      return (
                        <td key={ck} className={`rounded-md px-3 py-3 text-center tabular-nums ${a === b ? "font-semibold" : ""}`} style={{ background: `rgba(29,78,216,${Math.min(0.55, (v / stats.n) * 1.6)})`, color: v / stats.n > 0.3 ? "#fff" : "#0f172a" }}>
                          {v}
                          <span className="ml-1 text-xs opacity-80">{tot ? `${Math.round((100 * v) / tot)}%` : ""}</span>
                        </td>
                      );
                    })}
                    <td className={tdNum}>{tot}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Card
        title="All compared blocks"
        action={
          <button
            type="button"
            onClick={() =>
              downloadCsv(
                "model_vs_nsv_50m.csv",
                ["nsv_start_m", "nsv_end_m", "nsv_lwp_iri", "nsv_rwp_iri", "nsv_avg_iri", "model_iri", "difference_model_minus_nsv", "model_coverage", "doubtful", "model_chainage_from_m", "model_chainage_to_m"],
                rows.map((x, i) => [x.nsv.startM, x.nsv.endM, x.nsv.lwp, x.nsv.rwp, x.nsv.avg, used[i] ? (x.model as number).toFixed(3) : "", used[i] ? ((x.model as number) - x.nsv.avg).toFixed(3) : "", x.coverage.toFixed(2), x.uncertain ? "yes" : "no", x.fromM ?? "", x.toM ?? ""]),
              )
            }
            className="inline-flex items-center rounded-lg border-[1.5px] border-primary/50 bg-surface px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary-50"
          >
            Download CSV
          </button>
        }
      >
        <div className="-mx-2 max-h-[28rem] overflow-auto">
          <table className="w-full min-w-[760px]">
            <thead className="sticky top-0 bg-surface">
              <tr className="border-b border-line">
                <th className={th}>NSV block</th>
                <th className={th}>Model chainage</th>
                <th className={thNum}>NSV</th>
                <th className={thNum}>Model</th>
                <th className={thNum}>Difference</th>
                <th className={thNum}>Coverage</th>
                <th className={th}>Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((x, i) => (
                <tr key={x.nsv.startM} className={`cursor-pointer hover:bg-canvas ${i === c ? "bg-primary-50/70" : ""}`} onClick={() => setCur(i)}>
                  <td className={`${td} tabular-nums`}>{rangeLabel(x.nsv.startM, x.nsv.endM)}</td>
                  <td className={`${td} tabular-nums text-ink-muted`}>{x.fromM != null && x.toM != null ? rangeLabel(x.fromM, x.toM) : ""}</td>
                  <td className={tdNum}>{x.nsv.avg.toFixed(2)}</td>
                  <td className={tdNum}>{used[i] ? (x.model as number).toFixed(2) : ""}</td>
                  <td className={`${tdNum} font-medium`}>{used[i] ? signed((x.model as number) - x.nsv.avg) : ""}</td>
                  <td className={tdNum}>{x.model == null ? "" : `${(100 * x.coverage).toFixed(0)}%`}</td>
                  <td className={td}>
                    {x.model == null ? <span className="text-ink-muted">No model block</span> : x.uncertain ? <span className="rounded-full border border-danger/40 bg-danger-50 px-2 py-0.5 text-[11px] font-medium text-danger">Doubtful</span> : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
