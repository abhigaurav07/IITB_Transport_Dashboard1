"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import NsvProfile from "./NsvProfile";
import { Card, ConditionBadge, td, tdNum, th, thNum } from "@/components/iri/ui";
import StatCard from "@/components/ui/StatCard";
import { MAP_HI, MAP_LO, NSV_URL, summariseNsv, type NsvBlock } from "@/lib/atal/nsv";
import { ratingById, conditionOf, DEFAULT_RATING_ID, ratingName } from "@/lib/iri/rating";
import { fmtCh } from "@/lib/iri/format";
import { CLASS_COLOR, NO_DATA, RAMP_CSS } from "@/lib/iri/scale";
import type { Condition } from "@/lib/iri/types";

const NsvMap = dynamic(() => import("./NsvMap"), {
  ssr: false,
  loading: () => <div className="grid h-full place-items-center text-sm text-ink-muted">Loading map</div>,
});

const rangeLabel = (b: NsvBlock) => `${fmtCh(b.startM / 1000)} to ${fmtCh(b.endM / 1000)}`;

function BlockPanel({ b, i, n, mean }: { b: NsvBlock; i: number; n: number; mean: number }) {
  const rating = ratingById(DEFAULT_RATING_ID);
  const rows: [string, string][] = [
    ["Block", `${i + 1} of ${n}`],
    ["Chainage", rangeLabel(b)],
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
  const share = (c: Condition) => (100 * sum.lengthKm[c]) / sum.km;
  const b = blocks[cur];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Surveyed length" value={`${sum.km.toFixed(1)} km`} sublabel={`Chainage ${fmtCh(sum.startKm)} to ${fmtCh(sum.endKm)} · ${sum.blocks} blocks of 50 m`} />
        <StatCard label="Mean IRI" value={sum.mean.toFixed(2)} tone="primary" sublabel={`Median ${sum.median.toFixed(2)} · lowest ${sum.lowest.toFixed(2)} · highest ${sum.highest.toFixed(2)}`} />
        <StatCard label="Good condition" value={`${share("Good").toFixed(0)}%`} tone="success" sublabel={`${sum.lengthKm.Good.toFixed(1)} km below ${rating.good.toFixed(2)} (${nm.table})`} />
        <StatCard label="Highest block" value={blocks[sum.worst].avg.toFixed(2)} sublabel={`At ${rangeLabel(blocks[sum.worst])}`} />
      </div>

      <NsvProfile blocks={blocks} cur={cur} setCur={setCur} rating={rating} />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Card title="Map of NSV IRI">
          <div className="h-[34rem] overflow-hidden rounded-lg border border-line bg-slate-100">
            <NsvMap blocks={blocks} cur={cur} setCur={setCur} />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-ink-muted">
            <span className="inline-flex items-center gap-2">
              <span>≤{MAP_LO.toFixed(1)}</span>
              <span className="h-2.5 w-44 rounded-full" style={{ background: RAMP_CSS }} aria-hidden />
              <span>≥{MAP_HI.toFixed(1)}</span>
              <span>average IRI (m/km)</span>
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-sm border border-slate-300" style={{ background: NO_DATA }} aria-hidden />
              Hover or click the route to read a block
            </span>
          </div>
        </Card>
        <Card title="Selected block">
          <BlockPanel b={b} i={cur} n={blocks.length} mean={sum.mean} />
        </Card>
      </div>

      <Card title="Condition by length of road" subtitle={`IRC:SP:16-2019 ${nm.table}. Good below ${rating.good.toFixed(2)}, Poor above ${rating.fair.toFixed(2)}.`}>
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100" role="img" aria-label={(["Good", "Fair", "Poor"] as Condition[]).map((c) => `${c} ${share(c).toFixed(1)} percent`).join(", ")}>
          {(["Good", "Fair", "Poor"] as Condition[]).map((c) => (share(c) > 0 ? <span key={c} style={{ width: `${share(c)}%`, background: CLASS_COLOR[c] }} /> : null))}
        </div>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {(["Good", "Fair", "Poor"] as Condition[]).map((c) => (
            <span key={c} className="inline-flex items-center gap-2">
              <ConditionBadge c={c} />
              <b className="tabular-nums">{sum.lengthKm[c].toFixed(1)} km</b>
              <span className="text-ink-muted tabular-nums">({share(c).toFixed(1)}%)</span>
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
                      {rangeLabel(blocks[i])}
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
          <a href={NSV_URL} download="nsv_iri_50m.csv" className="inline-flex items-center rounded-lg border-[1.5px] border-primary/50 bg-surface px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary-50">
            Download CSV
          </a>
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
                <tr key={x.startM} className={`cursor-pointer hover:bg-canvas ${i === cur ? "bg-primary-50/70" : ""}`} onClick={() => setCur(i)}>
                  <td className={`${td} tabular-nums`}>{rangeLabel(x)}</td>
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
