"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import ProfileChart from "./ProfileChart";
import MapLegend from "./MapLegend";
import { Card, ConditionBadge, td, tdNum, th, thNum } from "@/components/iri/ui";
import StatCard from "@/components/ui/StatCard";
import { MAP_HI, MAP_LO, MODEL_COLOR, summariseBlocks } from "@/lib/atal/nsv";
import { LEN_TOL_M, lengthCheck, type ModelBlock } from "@/lib/atal/model";
import type { ModelPlacement } from "@/lib/atal/align";
import { downloadCsv, rangeLabel, signed } from "@/lib/atal/format";
import { conditionOf, DEFAULT_RATING_ID, ratingById, ratingName } from "@/lib/iri/rating";
import { fmtCh } from "@/lib/iri/format";
import { CLASS_COLOR, rampRgb, rgbCss } from "@/lib/iri/scale";
import type { Condition } from "@/lib/iri/types";

const RouteMap = dynamic(() => import("./RouteMap"), {
  ssr: false,
  loading: () => <div className="grid h-full place-items-center text-sm text-ink-muted">Loading map</div>,
});

const POOR = "#b91c1c";
const GOOD = "#15803d";

function BlockPanel({ b, i, n, mean, place }: { b: ModelBlock; i: number; n: number; mean: number; place?: ModelPlacement }) {
  const rating = ratingById(DEFAULT_RATING_ID);
  const off = Math.abs(b.devM) > LEN_TOL_M;
  const rows: [string, string][] = [
    ["Block", `${i + 1} of ${n}`],
    ["Model chainage", rangeLabel(b.startM, b.endM)],
    ["On the NSV route", place?.usable ? rangeLabel(Math.round(place.a), Math.round(place.b)) : "not placed"],
    ["Average speed", Number.isFinite(b.speed) ? `${b.speed.toFixed(1)} km/h` : "no data"],
    ["Readings in block", b.samples ? b.samples.toLocaleString() : "no data"],
    ["Starts at", `${b.lat.toFixed(5)}, ${b.lon.toFixed(5)}`],
  ];
  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="text-4xl font-semibold tabular-nums text-ink">{b.iri.toFixed(2)}</span>
        <ConditionBadge c={conditionOf(b.iri, rating)} />
      </div>
      <p className="mt-1 text-xs text-ink-muted">Predicted IRI · route mean {mean.toFixed(2)}</p>
      <div className={`mt-4 rounded-lg border px-3 py-2.5 text-sm ${off ? "border-danger/40 bg-danger-50" : "border-line bg-canvas"}`}>
        <div className="flex justify-between gap-3">
          <span className="text-ink-muted">Length by coordinates</span>
          <b className="tabular-nums">{b.lenM.toFixed(1)} m</b>
        </div>
        <p className={`mt-0.5 text-xs ${off ? "font-medium text-danger" : "text-ink-muted"}`}>
          {off ? `Block is labelled ${b.endM - b.startM} m: off by ${signed(b.devM, 1)} m` : `Labelled ${b.endM - b.startM} m: off by ${signed(b.devM, 1)} m`}
        </p>
      </div>
      <dl className="mt-4 space-y-2 text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4">
            <dt className="text-ink-muted">{k}</dt>
            <dd className="text-right tabular-nums text-ink">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default function PredictedTab({ blocks, placement }: { blocks: ModelBlock[]; placement: ModelPlacement[] | null }) {
  const rating = ratingById(DEFAULT_RATING_ID);
  const nm = ratingName(rating.id);
  const starts = useMemo(() => blocks.map((x) => x.startM), [blocks]);
  const ends = useMemo(() => blocks.map((x) => x.endM), [blocks]);
  const values = useMemo(() => blocks.map((x) => x.iri), [blocks]);
  const sum = useMemo(() => summariseBlocks(starts, ends, values, rating), [starts, ends, values, rating]);
  const chk = useMemo(() => lengthCheck(blocks), [blocks]);
  const distinct = useMemo(() => new Set(values.map((v) => Math.round(v * 1000))).size, [values]);
  const top = useMemo(() => blocks.map((_, i) => i).sort((a, b) => blocks[b].iri - blocks[a].iri).slice(0, 10), [blocks]);
  const [cur, setCur] = useState(0);
  const share = (c: Condition) => (100 * sum.lengthKm[c]) / sum.km;
  const c = Math.min(cur, blocks.length - 1);
  const b = blocks[c];

  const segs = useMemo(() => blocks.map((x) => ({ a: [x.lat, x.lon] as [number, number], b: [x.endLat, x.endLon] as [number, number] })), [blocks]);
  const flags = useMemo(() => blocks.map((x) => Math.abs(x.devM) > LEN_TOL_M), [blocks]);
  const colors = useMemo(() => blocks.map((x) => rgbCss(rampRgb(x.iri, MAP_LO, MAP_HI))), [blocks]);
  const panels = useMemo(
    () => [
      {
        height: 280,
        kind: "abs" as const,
        thresholds: [[rating.good, GOOD], [rating.fair, POOR]] as [number, string][],
        series: [{ key: "model", color: MODEL_COLOR, values }],
      },
    ],
    [rating, values],
  );
  const total = blocks.length;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Modelled length" value={`${sum.km.toFixed(2)} km`} sublabel={`Model chainage ${fmtCh(sum.startKm)} to ${fmtCh(sum.endKm)} · ${total} blocks of 50 m`} />
        <StatCard label="Mean predicted IRI" value={sum.mean.toFixed(2)} tone="primary" sublabel={`Median ${sum.median.toFixed(2)} · lowest ${sum.lowest.toFixed(2)} · highest ${sum.highest.toFixed(2)}`} />
        <StatCard label="Poor condition" value={`${share("Poor").toFixed(0)}%`} tone={share("Poor") > 50 ? "warning" : "success"} sublabel={`${sum.lengthKm.Poor.toFixed(1)} km above ${rating.fair.toFixed(2)} (${nm.table})`} />
        <StatCard label="Distinct values" value={`${distinct}`} sublabel={`${distinct} different IRI values across ${total} blocks`} />
      </div>

      <ProfileChart
        title="Predicted IRI along the model chainage"
        starts={starts}
        ends={ends}
        panels={panels}
        cur={c}
        setCur={setCur}
        ariaLabel="Predicted IRI of each 50 m block along the model chainage"
        legend={
          <>
            <span className="inline-flex items-center gap-2"><span className="h-[3px] w-5 rounded" style={{ background: MODEL_COLOR }} />Predicted IRI</span>
            <span className="inline-flex items-center gap-2"><span className="w-5 border-t-2 border-dashed" style={{ borderColor: POOR }} />Poor above {rating.fair.toFixed(2)}</span>
            <span className="inline-flex items-center gap-2"><span className="w-5 border-t-2 border-dashed" style={{ borderColor: GOOD }} />Good below {rating.good.toFixed(2)}</span>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Card title="Map of predicted IRI">
          <div className="h-[34rem] overflow-hidden rounded-lg border border-line bg-slate-100">
            <RouteMap segs={segs} colors={colors} flags={flags} cur={c} setCur={setCur} startLabel={`Start, model chainage ${fmtCh(sum.startKm)}`} endLabel={`End, model chainage ${fmtCh(sum.endKm)}`} ariaLabel="Route map coloured by predicted IRI" />
          </div>
          <MapLegend note={`Red halo: block length by coordinates is more than ${LEN_TOL_M} m off 50 m`} />
        </Card>
        <Card title="Selected block">
          <BlockPanel b={b} i={c} n={total} mean={sum.mean} place={placement?.[c]} />
        </Card>
      </div>

      <Card title="Condition by length of road" subtitle={`IRC:SP:16-2019 ${nm.table}. Good below ${rating.good.toFixed(2)}, Poor above ${rating.fair.toFixed(2)}.`}>
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100" role="img" aria-label={(["Good", "Fair", "Poor"] as Condition[]).map((k) => `${k} ${share(k).toFixed(1)} percent`).join(", ")}>
          {(["Good", "Fair", "Poor"] as Condition[]).map((k) => (share(k) > 0 ? <span key={k} style={{ width: `${share(k)}%`, background: CLASS_COLOR[k] }} /> : null))}
        </div>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {(["Good", "Fair", "Poor"] as Condition[]).map((k) => (
            <span key={k} className="inline-flex items-center gap-2">
              <ConditionBadge c={k} />
              <b className="tabular-nums">{sum.lengthKm[k].toFixed(1)} km</b>
              <span className="text-ink-muted tabular-nums">({share(k).toFixed(1)}%)</span>
            </span>
          ))}
        </div>
      </Card>

      <Card
        title="Block length check"
        subtitle={`Distance between each block's start and end coordinates, against the labelled 50 m. By coordinates the route is ${chk.coordKm.toFixed(2)} km, labelled ${chk.labelledKm.toFixed(2)} km.`}
      >
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100" role="img" aria-label={chk.buckets.map((k) => `${k.label}: ${k.count} blocks`).join(", ")}>
          {chk.buckets.map((k) => (k.count ? <span key={k.label} style={{ width: `${(100 * k.count) / total}%`, background: k.color }} /> : null))}
        </div>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {chk.buckets.map((k) => (
            <span key={k.label} className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: k.color }} aria-hidden />
              {k.label}
              <b className="tabular-nums">{k.count}</b>
              <span className="text-ink-muted tabular-nums">({((100 * k.count) / total).toFixed(0)}%)</span>
            </span>
          ))}
        </div>
        {chk.flagged.length ? (
          <div className="-mx-2 mt-4 max-h-80 overflow-auto">
            <table className="w-full min-w-[460px]">
              <thead className="sticky top-0 bg-surface">
                <tr className="border-b border-line">
                  <th className={th}>Block (model chainage)</th>
                  <th className={thNum}>Length by coordinates</th>
                  <th className={thNum}>Off by</th>
                  <th className={thNum}>Predicted IRI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {chk.flagged.map((i) => (
                  <tr key={i} className={`cursor-pointer hover:bg-canvas ${i === c ? "bg-primary-50/70" : ""}`} onClick={() => setCur(i)}>
                    <td className={`${td} font-medium tabular-nums text-primary`}>{rangeLabel(blocks[i].startM, blocks[i].endM)}</td>
                    <td className={tdNum}>{blocks[i].lenM.toFixed(1)} m</td>
                    <td className={tdNum}>{signed(blocks[i].devM, 1)} m</td>
                    <td className={tdNum}>{blocks[i].iri.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </Card>

      <Card title="Ten blocks with the highest predicted IRI">
        <div className="-mx-2 overflow-x-auto">
          <table className="w-full min-w-[420px]">
            <thead>
              <tr className="border-b border-line">
                <th className={th}>Block (model chainage)</th>
                <th className={thNum}>Predicted IRI</th>
                <th className={th}>Class</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {top.map((i) => (
                <tr key={i} className="cursor-pointer hover:bg-canvas" onClick={() => setCur(i)}>
                  <td className={td}>
                    <button type="button" className="font-medium tabular-nums text-primary hover:underline" onClick={(e) => { e.stopPropagation(); setCur(i); }}>
                      {rangeLabel(blocks[i].startM, blocks[i].endM)}
                    </button>
                  </td>
                  <td className={tdNum}>{blocks[i].iri.toFixed(2)}</td>
                  <td className={td}><ConditionBadge c={conditionOf(blocks[i].iri, rating)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card
        title="All 50 m blocks"
        action={
          <button
            type="button"
            onClick={() =>
              downloadCsv("predicted_iri_blocks.csv", ["start_chainage_m", "end_chainage_m", "predicted_iri", "speed_kmh", "readings", "length_by_coordinates_m", "length_off_m", "start_lat", "start_lon", "end_lat", "end_lon"], blocks.map((x) => [x.startM, x.endM, x.iri, Number.isFinite(x.speed) ? x.speed.toFixed(1) : "", x.samples, x.lenM.toFixed(1), x.devM.toFixed(1), x.lat, x.lon, x.endLat, x.endLon]))
            }
            className="inline-flex items-center rounded-lg border-[1.5px] border-primary/50 bg-surface px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary-50"
          >
            Download CSV
          </button>
        }
      >
        <div className="-mx-2 max-h-[28rem] overflow-auto">
          <table className="w-full min-w-[620px]">
            <thead className="sticky top-0 bg-surface">
              <tr className="border-b border-line">
                <th className={th}>Block (model chainage)</th>
                <th className={thNum}>Predicted IRI</th>
                <th className={thNum}>Length by coordinates</th>
                <th className={thNum}>Speed</th>
                <th className={th}>Class</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {blocks.map((x, i) => (
                <tr key={x.startM} className={`cursor-pointer hover:bg-canvas ${i === c ? "bg-primary-50/70" : ""}`} onClick={() => setCur(i)}>
                  <td className={`${td} tabular-nums`}>{rangeLabel(x.startM, x.endM)}</td>
                  <td className={`${tdNum} font-medium`}>{x.iri.toFixed(2)}</td>
                  <td className={`${tdNum} ${Math.abs(x.devM) > LEN_TOL_M ? "font-semibold text-danger" : ""}`}>{x.lenM.toFixed(1)} m</td>
                  <td className={tdNum}>{Number.isFinite(x.speed) ? x.speed.toFixed(1) : ""}</td>
                  <td className={td}><ConditionBadge c={conditionOf(x.iri, rating)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
