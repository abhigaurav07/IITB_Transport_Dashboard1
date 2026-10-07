"use client";

import { useMemo } from "react";
import { Card, ConditionBadge, td, tdNum, th, thNum } from "./ui";
import type { View } from "./view";
import StatCard from "@/components/ui/StatCard";
import { routeOverview, stretchStep, stretches, summarise, topBlocks } from "@/lib/iri/stats";
import { blockLenM } from "@/lib/iri/routes";
import { conditionOf, ratingName } from "@/lib/iri/rating";
import { fmtCh } from "@/lib/iri/format";
import { CLASS_COLOR } from "@/lib/iri/scale";
import type { Condition } from "@/lib/iri/types";

export default function SummaryTab({ v, onOpenBasis, onGoBlock }: { v: View; onOpenBasis: () => void; onGoBlock: (i: number) => void }) {
  const { route, rating } = v;
  const sum = useMemo(() => summarise(route, rating), [route, rating]);
  const rows = useMemo(() => stretches(route, rating), [route, rating]);
  const top = useMemo(() => topBlocks(route, 10), [route]);
  const step = stretchStep(route.km[route.n - 1]);
  const nm = ratingName(rating.id);
  if (!sum) return null;
  const share = (c: Condition) => (sum.coveredKm ? (100 * sum.lengthKm[c]) / sum.coveredKm : 0);
  const worst = sum.worst;

  return (
    <div className="space-y-5">
      {v.routes.length > 1 ? (
        <Card title="Routes loaded" subtitle="Select a route to show it. All tabs describe one route at a time.">
          <div className="-mx-2 overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-line">
                  <th className={th}>Route</th>
                  <th className={thNum}>Length</th>
                  <th className={thNum}>Blocks</th>
                  <th className={thNum}>Drivers in average</th>
                  <th className={thNum}>Mean block average</th>
                  <th className={thNum}>Poor (by length)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {v.routes.map((r) => {
                  const o = routeOverview(r, rating);
                  const cur = r.id === route.id;
                  return (
                    <tr key={r.id} className={`cursor-pointer hover:bg-canvas ${cur ? "bg-primary-50/60" : ""}`} onClick={() => v.selectRoute(r.id)}>
                      <td className={td}>
                        <button type="button" className="font-medium text-primary hover:underline" onClick={(e) => { e.stopPropagation(); v.selectRoute(r.id); }}>
                          {r.name}
                        </button>
                        {cur ? <span className="ml-2 text-xs text-ink-muted">shown</span> : null}
                      </td>
                      <td className={tdNum}>{o.km.toFixed(1)} km</td>
                      <td className={tdNum}>{o.blocks.toLocaleString()}</td>
                      <td className={tdNum}>{o.active} of {o.total}</td>
                      <td className={tdNum}>{o.mean == null ? "no data" : o.mean.toFixed(2)}</td>
                      <td className={tdNum}>{o.poor == null ? "" : `${(100 * o.poor).toFixed(0)}%`}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Route length" value={`${sum.km.toFixed(1)} km`} sublabel={`Chainage 0+000 to ${fmtCh(sum.km)} · ${sum.blocks.toLocaleString()} blocks`} />
        <StatCard
          label="Mean of block averages"
          value={sum.mean.toFixed(2)}
          tone="primary"
          sublabel={`Median ${sum.median.toFixed(2)} · lowest ${sum.lowest.toFixed(2)} · highest ${sum.highest.toFixed(2)}`}
        />
        <StatCard
          label="Poor condition"
          value={`${(100 * sum.poorShare).toFixed(0)}%`}
          tone={sum.poorShare > 0.5 ? "warning" : "success"}
          sublabel={`${sum.lengthKm.Poor.toFixed(1)} km above ${rating.fair.toFixed(2)} (${nm.table})`}
        />
        <StatCard
          label="Highest block average"
          value={(route.avg[worst] as number).toFixed(2)}
          sublabel={`At ${fmtCh(route.km[worst])} to ${fmtCh(route.km[worst + 1])} · ${route.nd[worst]} driver${route.nd[worst] === 1 ? "" : "s"}`}
        />
      </div>

      <Card title="Condition by length of road" subtitle={`Rating basis: IRC:SP:16-2019 ${nm.table}, ${nm.text}. Good below ${rating.good.toFixed(2)}, Poor above ${rating.fair.toFixed(2)}.`}
        action={<button type="button" onClick={onOpenBasis} className="shrink-0 text-xs font-medium text-primary hover:underline">Change basis</button>}>
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

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <Card title={`Average IRI by ${step} km stretch`} subtitle="Select a row to open the first block of the stretch in the drive-through.">
          <div className="-mx-2 overflow-x-auto">
            <table className="w-full min-w-[420px]">
              <thead>
                <tr className="border-b border-line">
                  <th className={th}>Stretch (chainage)</th>
                  <th className={thNum}>Average</th>
                  <th className={th}>Condition</th>
                  <th className={thNum}>Poor share</th>
                  <th className={thNum}>Highest</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((s) => (
                  <tr key={s.from} className="cursor-pointer hover:bg-canvas" onClick={() => onGoBlock(s.first)}>
                    <td className={td}>
                      <button type="button" className="font-medium tabular-nums text-primary hover:underline" onClick={(e) => { e.stopPropagation(); onGoBlock(s.first); }}>
                        {fmtCh(s.from)} to {fmtCh(s.to)}
                      </button>
                    </td>
                    <td className={tdNum}>{s.mean.toFixed(2)}</td>
                    <td className={td}><ConditionBadge c={conditionOf(s.mean, rating)} /></td>
                    <td className={tdNum}>{(100 * s.poorShare).toFixed(0)}%</td>
                    <td className={tdNum}>{s.highest.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Ten blocks with the highest average IRI" subtitle="A block covered by one driver rests on a single measurement, so the driver count is shown.">
          <div className="-mx-2 overflow-x-auto">
            <table className="w-full min-w-[460px]">
              <thead>
                <tr className="border-b border-line">
                  <th className={th}>Block (chainage)</th>
                  <th className={thNum}>Average</th>
                  <th className={thNum}>Drivers</th>
                  <th className={thNum}>Range</th>
                  <th className={thNum}>Length</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {top.map((i) => (
                  <tr key={i} className="cursor-pointer hover:bg-canvas" onClick={() => onGoBlock(i)}>
                    <td className={td}>
                      <button type="button" className="font-medium tabular-nums text-primary hover:underline" onClick={(e) => { e.stopPropagation(); onGoBlock(i); }}>
                        {fmtCh(route.km[i])} to {fmtCh(route.km[i + 1])}
                      </button>
                    </td>
                    <td className={tdNum}>{(route.avg[i] as number).toFixed(2)}</td>
                    <td className={tdNum}>{route.nd[i]}</td>
                    <td className={tdNum}>{route.nd[i] > 1 ? `${(route.min[i] as number).toFixed(2)} to ${(route.max[i] as number).toFixed(2)}` : <span className="text-ink-muted">single value</span>}</td>
                    <td className={tdNum}>{(blockLenM(route, i) ?? 0).toFixed(0)} m</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
