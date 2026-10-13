"use client";

import type { PointerEvent } from "react";
import { Card, useWidth } from "@/components/iri/ui";
import { MODEL_COLOR, NSV_COLOR } from "@/lib/atal/nsv";

const AXIS = "#334155";
const GRID = "#e2e8f0";

function niceMax(v: number): number {
  return Math.max(5, Math.ceil(v));
}

export interface ScatterPoint {
  i: number; // block index
  x: number; // NSV IRI
  y: number; // model IRI
  uncertain: boolean;
}

/** Model IRI against NSV IRI, one dot per 50 m block, with the line where the two agree. */
export function ScatterCard({ points, cur, setCur }: { points: ScatterPoint[]; cur: number; setCur: (i: number) => void }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const W = Math.max(280, width);
  const H = Math.min(360, Math.max(280, W * 0.75));
  const M = { l: 44, r: 14, t: 12, b: 40 };
  const max = niceMax(Math.max(0, ...points.map((p) => Math.max(p.x, p.y))));
  const x = (v: number) => M.l + (v / max) * (W - M.l - M.r);
  const y = (v: number) => M.t + (1 - v / max) * (H - M.t - M.b);
  const ticks = Array.from({ length: max + 1 }, (_, k) => k);
  const onMove = (e: PointerEvent<SVGRectElement>) => {
    const r = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
    const px = e.clientX - r.left;
    const py = e.clientY - r.top;
    let best = -1;
    let bd = 14 * 14;
    for (const p of points) {
      const d = (x(p.x) - px) ** 2 + (y(p.y) - py) ** 2;
      if (d < bd) {
        bd = d;
        best = p.i;
      }
    }
    if (best >= 0) setCur(best);
  };
  const sel = points.find((p) => p.i === cur);
  return (
    <Card title="Model against NSV" subtitle="One dot per 50 m block. Dots on the dashed line would mean the model matches NSV.">
      <div ref={ref} className="w-full">
        <svg width={W} height={H} role="img" aria-label="Scatter of model IRI against NSV IRI" className="block max-w-full select-none">
          <rect x={M.l} y={M.t} width={W - M.l - M.r} height={H - M.t - M.b} fill="#fff" stroke={GRID} />
          {ticks.map((t) => (
            <g key={t}>
              <line x1={M.l} x2={W - M.r} y1={y(t)} y2={y(t)} stroke={GRID} />
              <line x1={x(t)} x2={x(t)} y1={M.t} y2={H - M.b} stroke={GRID} />
              <text x={M.l - 8} y={y(t) + 4} textAnchor="end" fontSize={11} fill={AXIS}>{t}</text>
              <text x={x(t)} y={H - M.b + 16} textAnchor="middle" fontSize={11} fill={AXIS}>{t}</text>
            </g>
          ))}
          <line x1={x(0)} y1={y(0)} x2={x(max)} y2={y(max)} stroke={AXIS} strokeWidth={1.4} strokeDasharray="6 4" />
          {points.map((p) => (
            <circle key={p.i} cx={x(p.x)} cy={y(p.y)} r={3} fill={MODEL_COLOR} opacity={0.55} stroke={p.uncertain ? "#dc2626" : "none"} strokeWidth={1.2} />
          ))}
          {sel ? <circle cx={x(sel.x)} cy={y(sel.y)} r={7} fill="none" stroke={NSV_COLOR} strokeWidth={2.4} /> : null}
          <text x={(M.l + W - M.r) / 2} y={H - 6} textAnchor="middle" fontSize={12} fontWeight={600} fill={AXIS}>NSV IRI (m/km)</text>
          <text transform={`translate(13 ${(M.t + H - M.b) / 2}) rotate(-90)`} textAnchor="middle" fontSize={12} fontWeight={600} fill={AXIS}>Model IRI (m/km)</text>
          <rect x={M.l} y={M.t} width={W - M.l - M.r} height={H - M.t - M.b} fill="transparent" style={{ cursor: "crosshair" }} onPointerMove={onMove} onPointerDown={onMove} />
        </svg>
      </div>
      <p className="mt-2 text-xs text-ink-muted">Red outline: block placed using a model block with a doubtful length.</p>
    </Card>
  );
}

/** Share of blocks in each IRI band, NSV beside the model. */
export function HistogramCard({ nsv, model }: { nsv: number[]; model: number[] }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const W = Math.max(280, width);
  const H = Math.min(360, Math.max(280, W * 0.75));
  const M = { l: 44, r: 14, t: 12, b: 40 };
  const max = niceMax(Math.max(0, ...nsv, ...model));
  const step = 0.5;
  const nb = Math.round(max / step);
  const bin = (v: number) => Math.min(nb - 1, Math.floor(v / step));
  const count = (vals: number[]) => {
    const c = new Array<number>(nb).fill(0);
    vals.forEach((v) => c[bin(v)]++);
    return c.map((k) => (vals.length ? (100 * k) / vals.length : 0));
  };
  const a = count(nsv);
  const b = count(model);
  const ymax = Math.max(10, Math.ceil(Math.max(...a, ...b) / 10) * 10);
  const x = (v: number) => M.l + (v / max) * (W - M.l - M.r);
  const y = (v: number) => M.t + (1 - v / ymax) * (H - M.t - M.b);
  const bw = (x(step) - x(0)) / 2 - 1;
  const yt = Array.from({ length: ymax / 10 + 1 }, (_, k) => k * 10);
  return (
    <Card title="Distribution of IRI values" subtitle="Share of blocks in each 0.5 m/km band.">
      <div className="mb-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-ink">
        <span className="inline-flex items-center gap-2"><span className="h-2.5 w-4 rounded-sm" style={{ background: NSV_COLOR }} />NSV</span>
        <span className="inline-flex items-center gap-2"><span className="h-2.5 w-4 rounded-sm" style={{ background: MODEL_COLOR }} />Model</span>
      </div>
      <div ref={ref} className="w-full">
        <svg width={W} height={H} role="img" aria-label="Distribution of NSV and model IRI values" className="block max-w-full select-none">
          <rect x={M.l} y={M.t} width={W - M.l - M.r} height={H - M.t - M.b} fill="#fff" stroke={GRID} />
          {yt.map((t) => (
            <g key={t}>
              <line x1={M.l} x2={W - M.r} y1={y(t)} y2={y(t)} stroke={GRID} />
              <text x={M.l - 8} y={y(t) + 4} textAnchor="end" fontSize={11} fill={AXIS}>{t}%</text>
            </g>
          ))}
          {Array.from({ length: max + 1 }, (_, k) => k).map((t) => (
            <text key={t} x={x(t)} y={H - M.b + 16} textAnchor="middle" fontSize={11} fill={AXIS}>{t}</text>
          ))}
          {a.map((v, k) => (v > 0 ? <rect key={`a${k}`} x={x(k * step) + 1} y={y(v)} width={bw} height={y(0) - y(v)} fill={NSV_COLOR} /> : null))}
          {b.map((v, k) => (v > 0 ? <rect key={`b${k}`} x={x(k * step) + 1 + bw} y={y(v)} width={bw} height={y(0) - y(v)} fill={MODEL_COLOR} /> : null))}
          <text x={(M.l + W - M.r) / 2} y={H - 6} textAnchor="middle" fontSize={12} fontWeight={600} fill={AXIS}>IRI (m/km)</text>
        </svg>
      </div>
    </Card>
  );
}
