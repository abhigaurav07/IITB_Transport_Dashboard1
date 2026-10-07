"use client";

import { ConditionBadge } from "./ui";
import type { View } from "./view";
import { blockLenM } from "@/lib/iri/routes";
import { conditionOf } from "@/lib/iri/rating";
import { fmt, fmtCh } from "@/lib/iri/format";
import { CLASS_COLOR } from "@/lib/iri/scale";

/** One line reading of the current block, used under the chart. */
export function BlockLine({ v }: { v: View }) {
  const { route, cur } = v;
  const sel = v.series[cur];
  const a = route.avg[cur];
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-1.5 rounded-lg bg-canvas px-4 py-2.5 text-sm text-ink-muted">
      <span>
        Chainage <b className="tabular-nums text-ink">{fmtCh(route.km[cur])}</b>
        {cur < route.n - 1 ? (
          <>
            {" "}
            to <b className="tabular-nums text-ink">{fmtCh(route.km[cur + 1])}</b>
          </>
        ) : null}
      </span>
      <span className="inline-flex items-center gap-2">
        Average <b className="tabular-nums text-ink">{fmt(a)}</b>
        <ConditionBadge c={conditionOf(a, v.rating)} />
        <span className="text-xs">
          ({route.nd[cur]} driver{route.nd[cur] === 1 ? "" : "s"}
          {route.nd[cur] ? `, range ${fmt(route.min[cur])} to ${fmt(route.max[cur])}` : ""})
        </span>
      </span>
      {v.selection !== "avg" ? (
        <span className="inline-flex items-center gap-2">
          {v.selectedLabel} <b className="tabular-nums text-ink">{fmt(sel)}</b>
          <ConditionBadge c={conditionOf(sel, v.rating)} />
        </span>
      ) : null}
    </div>
  );
}

/** Side panel reading of the current block, used next to the map. */
export function BlockPanel({ v }: { v: View }) {
  const { route, cur } = v;
  const sv = v.series[cur];
  const len = blockLenM(route, cur);
  const sel = v.selection === "avg" ? null : route.active.find((m) => m.ds.id === v.selection);
  return (
    <div aria-live="polite">
      <div className="flex items-baseline gap-3">
        <p className="text-4xl font-semibold tabular-nums text-ink">{fmt(sv)}</p>
        <ConditionBadge c={conditionOf(sv, v.rating)} />
      </div>
      <p className="mt-1 text-xs text-ink-muted">
        {v.selection === "avg"
          ? `Average of ${route.nd[cur]} driver${route.nd[cur] === 1 ? "" : "s"}${route.nd[cur] ? ` · range ${fmt(route.min[cur])} to ${fmt(route.max[cur])}` : ""}`
          : v.selectedLabel}
      </p>
      <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
        <dt className="text-ink-muted">Block</dt>
        <dd className="text-right tabular-nums">
          {cur + 1} of {route.n - 1}
        </dd>
        <dt className="text-ink-muted">Chainage</dt>
        <dd className="text-right tabular-nums">
          {fmtCh(route.km[cur])}
          {cur < route.n - 1 ? ` to ${fmtCh(route.km[cur + 1])}` : ""}
        </dd>
        <dt className="text-ink-muted">Length</dt>
        <dd className="text-right tabular-nums">{len != null ? `${len.toFixed(0)} m` : "end of route"}</dd>
        <dt className="text-ink-muted">Starts at</dt>
        <dd className="text-right tabular-nums">
          {route.lat[cur].toFixed(5)}, {route.lon[cur].toFixed(5)}
        </dd>
      </dl>
      <table className="mt-4 w-full text-sm">
        <thead>
          <tr className="border-b border-line text-[11px] uppercase tracking-wider text-ink-muted">
            <th className="py-1.5 text-left font-semibold">Driver</th>
            <th className="py-1.5 text-right font-semibold">IRI</th>
            <th className="py-1.5 text-right font-semibold">Speed</th>
            <th className="py-1.5 pl-3 text-left font-semibold">Class</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {route.active.map((m) => {
            const x = m.iri[cur];
            const c = conditionOf(x, v.rating);
            const sp = m.spd[cur];
            return (
              <tr key={m.ds.id}>
                <td className="py-2">
                  <span className="mr-2 inline-block h-2.5 w-2.5 rounded-sm align-middle" style={{ background: m.color }} aria-hidden />
                  {m.label.replace(/^Driver /, "")}
                </td>
                <td className="py-2 text-right tabular-nums">{x == null ? <span className="text-ink-muted">not driven</span> : x.toFixed(2)}</td>
                <td className="py-2 text-right tabular-nums text-ink-muted">{sp == null ? "" : `${sp.toFixed(0)} km/h`}</td>
                <td className="py-2 pl-3">
                  {c ? (
                    <span className="inline-flex items-center gap-1.5 text-xs">
                      <span className="h-2 w-2 rounded-full" style={{ background: CLASS_COLOR[c] }} aria-hidden />
                      {c}
                    </span>
                  ) : null}
                </td>
              </tr>
            );
          })}
          <tr>
            <td className="py-2 font-semibold">Average</td>
            <td className="py-2 text-right font-semibold tabular-nums">{fmt(route.avg[cur])}</td>
            <td />
            <td className="py-2 pl-3">
              <ConditionBadge c={conditionOf(route.avg[cur], v.rating)} />
            </td>
          </tr>
        </tbody>
      </table>
      {sel && sel.time[cur] ? <p className="mt-3 text-xs text-ink-muted">{sel.label} passed here on {sel.time[cur]}.</p> : null}
    </div>
  );
}
