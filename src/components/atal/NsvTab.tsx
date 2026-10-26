"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import ProfileChart from "./ProfileChart";
import MapLegend from "./MapLegend";
import { Card, ConditionBadge, td, tdNum, th, thNum } from "@/components/iri/ui";
import StatCard from "@/components/ui/StatCard";
import { LWP_COLOR, MAP_HI, MAP_LO, NSV_COLOR, RWP_COLOR, summariseNsv, type NsvBlock } from "@/lib/atal/nsv";
import { downloadCsv, rangeLabel } from "@/lib/atal/format";
import { conditionOf, DEFAULT_RATING_ID, ratingById, ratingName } from "@/lib/iri/rating";
import { fmtCh } from "@/lib/iri/format";
import { CLASS_COLOR, rampRgb, rgbCss } from "@/lib/iri/scale";
import type { Condition } from "@/lib/iri/types";

const RouteMap = dynamic(() => import("./RouteMap"), {
  ssr: false,
  loading: () => <div className="grid h-full place-items-center text-sm text-ink-muted">Loading map</div>,
});

const POOR = "var(--danger)";
const GOOD = "var(--success)";

function BlockPanel({ b, i, n, mean }: { b: NsvBlock; i: number; n: number; mean: number }) {
  const rating = ratingById(DEFAULT_RATING_ID);
  const rows: [string, string][] = [
    ["Block", `${i + 1} of ${n}`],
    ["Chainage", rangeLabel(b.startM, b.endM)],
    ["Length", `${b.endM - b.startM} m`],
    ["Bump integrator", b.bi.toLocaleString()],
    ["Survey speed", `${b.speed.toFixed(1)} km/h`],
    ["Starts at", `${b.lat.toFixed(5)}, ${b.lon.toFixed(5)}`],
  ];
  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="text-4xl font-semibold tabular-nums text-ink">{b.avg.toFixed(2)}</span>
        <ConditionBadge c={conditionOf(b.avg, rating)} />
      </div>
      <p className="mt-1 text-xs text-ink-muted">Average IRI · route mean {mean.toFixed(2)}</p>
      <div className="mt-4 overflow-hidden rounded-lg border border-line">
        <table className="w-full">
          <thead>
            <tr className="border-b border-line bg-canvas">
              <th className={th}>Wheel path</th>
              <th className={thNum}>IRI</th>
              <th className={th}>Class</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            <tr>
              <td className={td}>Left (LWP)</td>
              <td className={tdNum}>{b.lwp.toFixed(2)}</td>
              <td className={td}><ConditionBadge c={conditionOf(b.lwp, rating)} /></td>
            </tr>
            <tr>
              <td className={td}>Right (RWP)</td>
              <td className={tdNum}>{b.rwp.toFixed(2)}</td>
              <td className={td}><ConditionBadge c={conditionOf(b.rwp, rating)} /></td>
            </tr>
          </tbody>
        </table>
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

export default function NsvTab({ blocks }: { blocks: NsvBlock[] }) {
  const rating = ratingById(DEFAULT_RATING_ID);
  const nm = ratingName(rating.id);
  const sum = useMemo(() => summariseNsv(blocks, rating), [blocks, rating]);
  const top = useMemo(() => blocks.map((_, i) => i).sort((a, b) => blocks[b].avg - blocks[a].avg).slice(0, 10), [blocks]);
  const [cur, setCur] = useState(0);
  const [show, setShow] = useState({ lwp: false, rwp: false });
  const share = (c: Condition) => (100 * sum.lengthKm[c]) / sum.km;
  const c = Math.min(cur, blocks.length - 1);
  const b = blocks[c];

  const starts = useMemo(() => blocks.map((x) => x.startM), [blocks]);
  const ends = useMemo(() => blocks.map((x) => x.endM), [blocks]);
  const segs = useMemo(() => blocks.map((x) => ({ a: [x.lat, x.lon] as [number, number], b: [x.endLat, x.endLon] as [number, number] })), [blocks]);
  const colors = useMemo(() => blocks.map((x) => rgbCss(rampRgb(x.avg, MAP_LO, MAP_HI))), [blocks]);
  const panels = useMemo(
    () => [
      {
        height: 280,
        kind: "abs" as const,
        thresholds: [[rating.good, GOOD], [rating.fair, POOR]] as [number, string][],
        series: [
          ...(show.lwp ? [{ key: "lwp", color: LWP_COLOR, values: blocks.map((x) => x.lwp), width: 1.3 }] : []),
          ...(show.rwp ? [{ key: "rwp", color: RWP_COLOR, values: blocks.map((x) => x.rwp), width: 1.3 }] : []),
          { key: "avg", color: NSV_COLOR, values: blocks.map((x) => x.avg) },
        ],
      },
    ],
    [blocks, rating, show],
  );
  const chip = (k: "lwp" | "rwp", label: string, color: string) => (
    <button
      type="button"
      aria-pressed={show[k]}
      onClick={() => setShow((s) => ({ ...s, [k]: !s[k] }))}
      className={`inline-flex items-center gap-2 rounded-lg border-[1.5px] px-2.5 py-1 text-xs font-medium transition-colors ${show[k] ? "border-primary bg-primary-50 text-primary" : "border-outline bg-surface text-ink hover:border-primary"}`}
    >
      <span className="h-[3px] w-4 rounded" style={{ background: color }} />
      {label}
    </button>
  );

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Surveyed length" value={`${sum.km.toFixed(1)} km`} sublabel={`Chainage ${fmtCh(sum.startKm)} to ${fmtCh(sum.endKm)} · ${sum.blocks} blocks of 50 m`} />
        <StatCard label="Mean IRI" value={sum.mean.toFixed(2)} tone="primary" sublabel={`Median ${sum.median.toFixed(2)} · lowest ${sum.lowest.toFixed(2)} · highest ${sum.highest.toFixed(2)}`} />
        <StatCard label="Good condition" value={`${share("Good").toFixed(0)}%`} tone="success" sublabel={`${sum.lengthKm.Good.toFixed(1)} km below ${rating.good.toFixed(2)} (${nm.table})`} />
        <StatCard label="Highest block" value={blocks[sum.worst].avg.toFixed(2)} sublabel={`At ${rangeLabel(blocks[sum.worst].startM, blocks[sum.worst].endM)}`} />
      </div>

      <ProfileChart
        title="NSV IRI along the chainage"
        starts={starts}
        ends={ends}
        panels={panels}
        cur={c}
        setCur={setCur}
        ariaLabel="NSV IRI of each 50 m block along the chainage"
        legend={
          <>
            <span className="inline-flex items-center gap-2"><span className="h-[3px] w-5 rounded bg-ink" />Average IRI</span>
            {chip("lwp", "Left wheel path", LWP_COLOR)}
            {chip("rwp", "Right wheel path", RWP_COLOR)}
            <span className="inline-flex items-center gap-2"><span className="w-5 border-t-2 border-dashed" style={{ borderColor: POOR }} />Poor above {rating.fair.toFixed(2)}</span>
            <span className="inline-flex items-center gap-2"><span className="w-5 border-t-2 border-dashed" style={{ borderColor: GOOD }} />Good below {rating.good.toFixed(2)}</span>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Card title="Map of NSV IRI">
          <div className="h-[34rem] overflow-hidden rounded-lg border border-line bg-surface-2">
            <RouteMap segs={segs} colors={colors} cur={c} setCur={setCur} startLabel={`Start, chainage ${fmtCh(sum.startKm)}`} endLabel={`End, chainage ${fmtCh(sum.endKm)}`} ariaLabel="Route map coloured by NSV IRI" />
          </div>
          <MapLegend note="Hover or click the route to read a block" />
        </Card>
        <Card title="Selected block">
          <BlockPanel b={b} i={c} n={blocks.length} mean={sum.mean} />
        </Card>
      </div>

      <Card title="Condition by length of road" subtitle={`IRC:SP:16-2019 ${nm.table}. Good below ${rating.good.toFixed(2)}, Poor above ${rating.fair.toFixed(2)}.`}>
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-surface-2" role="img" aria-label={(["Good", "Fair", "Poor"] as Condition[]).map((k) => `${k} ${share(k).toFixed(1)} percent`).join(", ")}>
          {(["Good", "Fair", "Poor"] as Condition[]).map((k) => (share(k) > 0 ? <span key={k} className="tp-grow" style={{ width: `${share(k)}%`, background: CLASS_COLOR[k] }} /> : null))}
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

      <Card title="Ten blocks with the highest IRI">
        <div className="-mx-2 overflow-x-auto">
          <table className="w-full min-w-[460px]">
            <thead>
              <tr className="border-b border-line">
                <th className={th}>Block (chainage)</th>
                <th className={thNum}>Average</th>
                <th className={thNum}>Left</th>
                <th className={thNum}>Right</th>
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
                  <td className={tdNum}>{blocks[i].avg.toFixed(2)}</td>
                  <td className={tdNum}>{blocks[i].lwp.toFixed(2)}</td>
                  <td className={tdNum}>{blocks[i].rwp.toFixed(2)}</td>
                  <td className={td}><ConditionBadge c={conditionOf(blocks[i].avg, rating)} /></td>
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
              downloadCsv("nsv_iri_50m.csv", ["start_m", "end_m", "lwp_iri", "rwp_iri", "avg_iri", "bi", "speed_kmh", "lat", "lon", "end_lat", "end_lon"], blocks.map((x) => [x.startM, x.endM, x.lwp, x.rwp, x.avg, x.bi, x.speed, x.lat, x.lon, x.endLat, x.endLon]))
            }
            className="inline-flex items-center rounded-lg border-[1.5px] border-outline bg-surface px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary-50"
          >
            Download CSV
          </button>
        }
      >
        <div className="-mx-2 max-h-[28rem] overflow-auto">
          <table className="w-full min-w-[620px]">
            <thead className="sticky top-0 bg-surface">
              <tr className="border-b border-line">
                <th className={th}>Block (chainage)</th>
                <th className={thNum}>Left</th>
                <th className={thNum}>Right</th>
                <th className={thNum}>Average</th>
                <th className={thNum}>BI</th>
                <th className={thNum}>Speed</th>
                <th className={th}>Class</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {blocks.map((x, i) => (
                <tr key={x.startM} className={`cursor-pointer hover:bg-canvas ${i === c ? "bg-primary-50/70" : ""}`} onClick={() => setCur(i)}>
                  <td className={`${td} tabular-nums`}>{rangeLabel(x.startM, x.endM)}</td>
                  <td className={tdNum}>{x.lwp.toFixed(2)}</td>
                  <td className={tdNum}>{x.rwp.toFixed(2)}</td>
                  <td className={`${tdNum} font-medium`}>{x.avg.toFixed(2)}</td>
                  <td className={tdNum}>{x.bi.toLocaleString()}</td>
                  <td className={tdNum}>{x.speed.toFixed(1)}</td>
                  <td className={td}><ConditionBadge c={conditionOf(x.avg, rating)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
