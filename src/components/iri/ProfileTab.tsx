"use client";

import { useMemo, type PointerEvent } from "react";
import { Card, useWidth } from "./ui";
import { BlockLine } from "./BlockReadout";
import type { View } from "./view";
import { fmtCh, tickStep } from "@/lib/iri/format";

const H = 320;
const M = { l: 48, r: 40, t: 12, b: 32 };
const INK = "#0f172a";
const MUTED = "#64748b";
const GRID = "#e2e8f0";

export default function ProfileTab({ v }: { v: View }) {
  const { route, rating, cur } = v;
  const [ref, width] = useWidth<HTMLDivElement>();
  const W = Math.max(320, width);
  const total = route.km[route.n - 1];

  const geo = useMemo(() => {
    let lo = Infinity;
    let hi = -Infinity;
    route.active.forEach((m) =>
      m.iri.forEach((x) => {
        if (x != null) {
          if (x < lo) lo = x;
          if (x > hi) hi = x;
        }
      }),
    );
    const y0 = Math.min(2.5, Math.floor(lo * 2) / 2);
    const y1 = Math.max(5, Math.ceil(hi * 2) / 2);
    return { y0, y1 };
  }, [route]);

  const { y0, y1 } = geo;
  const x = (km: number) => M.l + (km / total) * (W - M.l - M.r);
  const y = (val: number) => M.t + ((y1 - val) / (y1 - y0)) * (H - M.t - M.b);
  const yc = (val: number) => Math.max(M.t, Math.min(H - M.b, y(val)));

  const paths = useMemo(() => {
    const step = (s: (number | null)[]) => {
      let d = "";
      let pen = false;
      for (let k = 0; k < route.n; k++) {
        const val = s[k];
        if (val == null) {
          pen = false;
          continue;
        }
        const x0 = x(route.km[k]).toFixed(1);
        const x1 = x(route.km[Math.min(k + 1, route.n - 1)]).toFixed(1);
        const yy = y(Math.min(val, y1)).toFixed(1);
        d += `${pen ? "L" : "M"}${x0},${yy}L${x1},${yy}`;
        pen = true;
      }
      return d;
    };
    const band = () => {
      let d = "";
      let i = 0;
      while (i < route.n) {
        if (route.max[i] == null) {
          i++;
          continue;
        }
        let j = i;
        while (j < route.n && route.max[j] != null) j++;
        let top = "";
        let bot = "";
        for (let k = i; k < j; k++) {
          const xa = x(route.km[k]).toFixed(1);
          const xb = x(route.km[Math.min(k + 1, route.n - 1)]).toFixed(1);
          const yy = y(Math.min(route.max[k] as number, y1)).toFixed(1);
          top += `${k === i ? "M" : "L"}${xa},${yy}L${xb},${yy}`;
        }
        for (let k = j - 1; k >= i; k--) {
          const xa = x(route.km[k]).toFixed(1);
          const xb = x(route.km[Math.min(k + 1, route.n - 1)]).toFixed(1);
          const yy = y(Math.min(route.min[k] as number, y1)).toFixed(1);
          bot += `L${xb},${yy}L${xa},${yy}`;
        }
        d += `${top}${bot}Z`;
        i = j;
      }
      return d;
    };
    return { avg: step(route.avg), sel: v.selection === "avg" ? "" : step(v.series), band: band() };
    // x and y depend only on W, y0, y1, total which are listed here
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route, v.series, v.selection, W, y0, y1, total]);

  const onMove = (e: PointerEvent<SVGRectElement>) => {
    const r = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
    const km = ((e.clientX - r.left - M.l) / (W - M.l - M.r)) * total;
    let a = 0;
    let b = route.n - 1;
    while (a < b) {
      const mid = (a + b) >> 1;
      if (route.km[mid] <= km) a = mid + 1;
      else b = mid;
    }
    v.setCur(Math.max(0, Math.min(route.n - 1, route.km[a] <= km ? a : a - 1)));
  };

  const ts = tickStep(total);
  const xTicks: number[] = [];
  for (let k = 0; k <= Math.floor(total); k += ts) xTicks.push(k);
  const yTicks: number[] = [];
  for (let t = Math.ceil(y0); t <= y1; t++) yTicks.push(t);
  const cx = x(route.km[cur] + (cur < route.n - 1 ? (route.km[cur + 1] - route.km[cur]) / 2 : 0));
  const cav = route.avg[cur];
  const selColor = v.selection === "avg" ? INK : route.members.find((m) => m.ds.id === v.selection)?.color ?? INK;

  return (
    <Card title="Average IRI of each 50 m block along the chainage" subtitle="The black line is the arithmetic mean of all included drivers for each block. The grey band spans the lowest to the highest driver. Hover or tap to read any block.">
      <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-ink-muted">
        <span className="inline-flex items-center gap-2"><span className="h-0.5 w-5 bg-ink" />Average of all drivers (each 50 m block)</span>
        {v.selection !== "avg" ? <span className="inline-flex items-center gap-2"><span className="h-0.5 w-5" style={{ background: selColor }} />{v.selectedLabel}</span> : null}
        <span className="inline-flex items-center gap-2"><span className="h-3 w-5 rounded-sm bg-ink/15" />Lowest to highest driver</span>
        <span className="inline-flex items-center gap-2"><span className="h-3 w-5 rounded-sm bg-danger/10" />Poor zone (above {rating.fair.toFixed(2)})</span>
      </div>
      <div ref={ref} className="w-full">
        <svg width={W} height={H} role="img" aria-label="Average IRI of each 50 m block along the chainage" className="block max-w-full select-none">
          <rect x={M.l} y={M.t} width={W - M.l - M.r} height={Math.max(0, yc(rating.fair) - M.t)} fill="#dc2626" opacity={0.06} />
          <rect x={M.l} y={yc(rating.fair)} width={W - M.l - M.r} height={Math.max(0, yc(rating.good) - yc(rating.fair))} fill="#f59e0b" opacity={0.1} />
          <rect x={M.l} y={yc(rating.good)} width={W - M.l - M.r} height={Math.max(0, yc(y0) - yc(rating.good))} fill="#15803d" opacity={0.08} />
          {yTicks.map((t) => (
            <g key={t}>
              <line x1={M.l} x2={W - M.r} y1={y(t)} y2={y(t)} stroke={GRID} />
              <text x={M.l - 8} y={y(t) + 4} textAnchor="end" fontSize={11} fill={MUTED}>{t}</text>
            </g>
          ))}
          {[rating.good, rating.fair].map((t) =>
            t >= y0 && t <= y1 ? (
              <g key={t}>
                <line x1={M.l} x2={W - M.r} y1={y(t)} y2={y(t)} stroke={MUTED} strokeDasharray="4 3" />
                <text x={W - M.r + 4} y={y(t) + 4} fontSize={10} fill={MUTED}>{t.toFixed(2)}</text>
              </g>
            ) : null,
          )}
          {xTicks.map((k) => (
            <text key={k} x={x(k)} y={H - 10} textAnchor="middle" fontSize={11} fill={MUTED}>{fmtCh(k)}</text>
          ))}
          <path d={paths.band} fill={INK} opacity={0.14} />
          {paths.sel ? <path d={paths.sel} fill="none" stroke={selColor} strokeWidth={1.2} opacity={0.9} /> : null}
          <path d={paths.avg} fill="none" stroke={INK} strokeWidth={1.8} strokeLinejoin="round" />
          <line x1={cx} x2={cx} y1={M.t} y2={H - M.b} stroke={INK} opacity={0.55} />
          {cav != null ? <circle cx={cx} cy={y(Math.min(cav, y1))} r={4.5} fill="#fff" stroke={INK} strokeWidth={2} /> : null}
          <rect x={M.l} y={M.t} width={W - M.l - M.r} height={H - M.t - M.b} fill="transparent" style={{ cursor: "crosshair" }} onPointerMove={onMove} onPointerDown={onMove} />
        </svg>
      </div>
      <BlockLine v={v} />
    </Card>
  );
}
