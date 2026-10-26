"use client";

import { useMemo, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { Button, Card, useWidth } from "@/components/iri/ui";
import { fmtCh } from "@/lib/iri/format";

export interface ChartSeries {
  key: string;
  color: string;
  values: (number | null)[];
  width?: number;
  kind?: "line" | "bars";
}
export interface ChartPanel {
  height: number;
  kind: "abs" | "diff";
  series: ChartSeries[];
  thresholds?: [number, string][]; // value and colour of a dashed reference line
  label?: string; // small axis caption
}

const M = { l: 52, r: 44, t: 14, b: 34 };
const GAP = 30;
const INK = "var(--chart-ink)";
const AXIS = "var(--chart-axis)";
const GRID = "var(--chart-grid)";
const MIN_SPAN_KM = 0.25;

function niceStep(span: number, target = 8): number {
  const raw = span / target;
  const p = Math.pow(10, Math.floor(Math.log10(raw)));
  const f = raw / p;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p;
}

/** Block-wise step chart along the chainage with drag-to-zoom. Several panels share one x axis. */
export default function ProfileChart({
  title,
  subtitle,
  starts,
  ends,
  panels,
  cur,
  setCur,
  legend,
  ariaLabel,
}: {
  title: string;
  subtitle?: ReactNode;
  starts: number[]; // metres
  ends: number[];
  panels: ChartPanel[];
  cur: number;
  setCur: (i: number) => void;
  legend?: ReactNode;
  ariaLabel: string;
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const W = Math.max(320, width);
  const n = starts.length;
  const t0 = starts[0] / 1000;
  const t1 = ends[n - 1] / 1000;
  const [zoom, setZoom] = useState<[number, number] | null>(null);
  const [drag, setDrag] = useState<{ a: number; b: number } | null>(null);
  const press = useRef<{ x: number; moved: boolean } | null>(null);

  const [v0, v1] = zoom && zoom[0] >= t0 && zoom[1] <= t1 ? zoom : [t0, t1];
  const zoomed = v0 > t0 + 0.0005 || v1 < t1 - 0.0005;
  const plotW = W - M.l - M.r;
  const x = (km: number) => M.l + ((km - v0) / (v1 - v0)) * plotW;
  const kmAt = (px: number) => v0 + ((px - M.l) / plotW) * (v1 - v0);

  const idxAt = (km: number) => {
    const m = km * 1000;
    let a = 0;
    let b = n - 1;
    while (a < b) {
      const mid = (a + b + 1) >> 1;
      if (starts[mid] <= m) a = mid;
      else b = mid - 1;
    }
    return a;
  };
  const iLo = Math.max(0, idxAt(v0) - 1);
  const iHi = Math.min(n - 1, idxAt(v1) + 1);

  const ranges = useMemo(
    () =>
      panels.map((p) => {
        let lo = Infinity;
        let hi = -Infinity;
        const from = zoomed ? iLo : 0;
        const to = zoomed ? iHi : n - 1;
        for (const s of p.series)
          for (let k = from; k <= to; k++) {
            const val = s.values[k];
            if (val == null) continue;
            if (val < lo) lo = val;
            if (val > hi) hi = val;
          }
        if (!isFinite(lo)) return p.kind === "diff" ? { y0: -1, y1: 1 } : { y0: 0, y1: 5 };
        if (p.kind === "diff") {
          const m = Math.max(0.5, Math.ceil(Math.max(Math.abs(lo), Math.abs(hi)) * 2) / 2);
          return { y0: -m, y1: m };
        }
        if (!zoomed) return { y0: 0, y1: Math.max(5, Math.ceil(hi)) };
        const pad = Math.max(0.15, (hi - lo) * 0.12);
        return { y0: Math.max(0, Math.floor((lo - pad) * 10) / 10), y1: Math.ceil((hi + pad) * 10) / 10 };
      }),
    [panels, n, zoomed, iLo, iHi],
  );

  const tops: number[] = [];
  let acc = M.t;
  panels.forEach((p) => {
    tops.push(acc);
    acc += p.height + GAP;
  });
  const bottom = acc - GAP;
  const H = bottom + M.b;

  const setRange = (a: number, b: number) => {
    let lo = Math.max(t0, Math.min(a, b));
    let hi = Math.min(t1, Math.max(a, b));
    if (hi - lo < MIN_SPAN_KM) {
      const c = (lo + hi) / 2;
      lo = Math.max(t0, c - MIN_SPAN_KM / 2);
      hi = Math.min(t1, lo + MIN_SPAN_KM);
      lo = Math.max(t0, hi - MIN_SPAN_KM);
    }
    setZoom(hi - lo >= t1 - t0 - 0.0005 ? null : [lo, hi]);
  };
  const zoomBy = (factor: number) => {
    const cc = (starts[cur] + ends[cur]) / 2000;
    const c = Math.max(v0, Math.min(v1, cc));
    const half = ((v1 - v0) * factor) / 2;
    const mid = c > v0 + half && c < v1 - half ? c : (v0 + v1) / 2;
    setRange(mid - half, mid + half);
  };

  const localX = (e: PointerEvent<SVGRectElement>) => e.clientX - (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect().left;
  const onDown = (e: PointerEvent<SVGRectElement>) => {
    press.current = { x: localX(e), moved: false };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onMove = (e: PointerEvent<SVGRectElement>) => {
    const px = localX(e);
    if (press.current) {
      if (Math.abs(px - press.current.x) > 4) press.current.moved = true;
      if (press.current.moved) setDrag({ a: press.current.x, b: px });
      return;
    }
    setCur(idxAt(kmAt(px)));
  };
  const onUp = (e: PointerEvent<SVGRectElement>) => {
    const p = press.current;
    press.current = null;
    setDrag(null);
    if (!p) return;
    const px = localX(e);
    if (p.moved && Math.abs(px - p.x) >= 14) setRange(kmAt(p.x), kmAt(px));
    else setCur(idxAt(kmAt(px)));
  };

  const ts = niceStep(v1 - v0);
  const xTicks: number[] = [];
  for (let k = Math.ceil(v0 / ts) * ts; k <= v1 + 1e-9; k += ts) xTicks.push(Math.round(k * 1e6) / 1e6);
  const cx = x((starts[cur] + ends[cur]) / 2000);

  const stepPath = (s: ChartSeries, y: (v: number) => number, y1: number) => {
    let d = "";
    let pen = false;
    for (let k = iLo; k <= iHi; k++) {
      const val = s.values[k];
      if (val == null) {
        pen = false;
        continue;
      }
      const yy = y(Math.min(val, y1)).toFixed(1);
      d += `${pen ? "L" : "M"}${x(starts[k] / 1000).toFixed(1)},${yy}L${x(ends[k] / 1000).toFixed(1)},${yy}`;
      pen = true;
    }
    return d;
  };

  return (
    <Card
      title={title}
      subtitle={subtitle}
      action={
        <div className="flex flex-wrap items-center justify-end gap-2">
          {zoomed ? (
            <span className="mr-1 text-xs tabular-nums text-ink-muted">{fmtCh(v0)} to {fmtCh(v1)}</span>
          ) : (
            <span className="mr-1 hidden text-xs text-ink-muted sm:inline">Drag on the graph to zoom</span>
          )}
          <Button size="sm" onClick={() => zoomBy(0.5)} ariaLabel="Zoom in">Zoom in</Button>
          <Button size="sm" onClick={() => zoomBy(2)} disabled={!zoomed} ariaLabel="Zoom out">Zoom out</Button>
          <Button size="sm" variant="primary" onClick={() => setZoom(null)} disabled={!zoomed} ariaLabel="Reset zoom">Reset</Button>
        </div>
      }
    >
      {legend ? <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-ink">{legend}</div> : null}
      <div ref={ref} className="w-full">
        <svg width={W} height={H} role="img" aria-label={ariaLabel} className="block max-w-full select-none">
          <defs>
            {panels.map((p, k) => (
              <clipPath key={k} id={`pc-clip-${k}`}>
                <rect x={M.l} y={tops[k]} width={Math.max(0, plotW)} height={p.height} />
              </clipPath>
            ))}
          </defs>
          {panels.map((p, k) => {
            const { y0, y1 } = ranges[k];
            const top = tops[k];
            const y = (val: number) => top + ((y1 - val) / (y1 - y0)) * p.height;
            const ys = niceStep(y1 - y0, p.height > 150 ? 6 : 4);
            const yTicks: number[] = [];
            for (let t = Math.ceil(y0 / ys) * ys; t <= y1 + 1e-9; t += ys) yTicks.push(Math.round(t * 1e6) / 1e6);
            return (
              <g key={k}>
                <rect x={M.l} y={top} width={Math.max(0, plotW)} height={p.height} fill="var(--chart-plot)" stroke={GRID} />
                {yTicks.map((t) => (
                  <g key={t}>
                    <line x1={M.l} x2={W - M.r} y1={y(t)} y2={y(t)} stroke={t === 0 && p.kind === "diff" ? AXIS : GRID} strokeWidth={t === 0 && p.kind === "diff" ? 1.4 : 1} />
                    <text x={M.l - 8} y={y(t) + 4} textAnchor="end" fontSize={11} fill={AXIS}>{Number.isInteger(t) ? t : t.toFixed(1)}</text>
                  </g>
                ))}
                {xTicks.map((t) => (
                  <line key={t} x1={x(t)} x2={x(t)} y1={top} y2={top + p.height} stroke={GRID} />
                ))}
                {p.label ? (
                  <text x={M.l + 8} y={top + 15} fontSize={11} fontWeight={600} fill={AXIS}>{p.label}</text>
                ) : null}
                <g clipPath={`url(#pc-clip-${k})`}>
                  {(p.thresholds ?? []).map(([t, c]) =>
                    t >= y0 && t <= y1 ? <line key={c} x1={M.l} x2={W - M.r} y1={y(t)} y2={y(t)} stroke={c} strokeWidth={1.6} strokeDasharray="6 4" /> : null,
                  )}
                  {p.series.map((s) =>
                    s.kind === "bars" ? (
                      <g key={s.key}>
                        {Array.from({ length: iHi - iLo + 1 }, (_, q) => iLo + q).map((i) => {
                          const val = s.values[i];
                          if (val == null) return null;
                          const xa = x(starts[i] / 1000);
                          const xb = x(ends[i] / 1000);
                          const ya = y(0);
                          const yb = y(Math.max(y0, Math.min(y1, val)));
                          return <rect key={i} x={xa} y={Math.min(ya, yb)} width={Math.max(1, xb - xa)} height={Math.max(1, Math.abs(yb - ya))} fill={val >= 0 ? s.color : "#1d4ed8"} opacity={0.85} />;
                        })}
                      </g>
                    ) : (
                      <path key={s.key} d={stepPath(s, y, y1)} fill="none" stroke={s.color} strokeWidth={(s.width ?? 1.9) + (zoomed ? 0.5 : 0)} strokeLinejoin="round" pathLength={1} className="tp-draw-chart" />
                    ),
                  )}
                  {cx >= M.l && cx <= W - M.r ? (
                    <>
                      <line x1={cx} x2={cx} y1={top} y2={top + p.height} stroke={INK} opacity={0.55} />
                      {p.series
                        .filter((s) => s.kind !== "bars")
                        .map((s) => {
                          const val = s.values[cur];
                          return val == null ? null : <circle key={s.key} cx={cx} cy={y(Math.min(val, y1))} r={4.5} fill="var(--chart-plot)" stroke={s.color} strokeWidth={2.2} />;
                        })}
                    </>
                  ) : null}
                </g>
                {(p.thresholds ?? []).map(([t, c]) =>
                  t >= y0 && t <= y1 ? <text key={c} x={W - M.r + 5} y={y(t) + 4} fontSize={11} fontWeight={600} fill={c}>{t.toFixed(2)}</text> : null,
                )}
              </g>
            );
          })}
          {xTicks.map((t) => (
            <text key={t} x={x(t)} y={bottom + 20} textAnchor="middle" fontSize={11} fill={AXIS}>{fmtCh(t)}</text>
          ))}
          {drag ? (
            <rect x={Math.max(M.l, Math.min(drag.a, drag.b))} y={M.t} width={Math.min(W - M.r, Math.max(drag.a, drag.b)) - Math.max(M.l, Math.min(drag.a, drag.b))} height={bottom - M.t} fill="#1d4ed8" opacity={0.14} stroke="#1d4ed8" />
          ) : null}
          <rect
            x={M.l}
            y={M.t}
            width={Math.max(0, plotW)}
            height={bottom - M.t}
            fill="transparent"
            style={{ cursor: "crosshair", touchAction: "pan-y" }}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={() => {
              press.current = null;
              setDrag(null);
            }}
            onDoubleClick={() => setZoom(null)}
          />
        </svg>
      </div>
      {zoomed ? (
        <div className="mt-2 flex items-center gap-3">
          <span className="text-xs text-ink-muted">Move</span>
          <input
            type="range"
            className="iri-range w-full"
            aria-label="Move the zoomed window along the chainage"
            min={t0}
            max={Math.max(t0 + 0.001, t1 - (v1 - v0))}
            step={0.01}
            value={v0}
            onChange={(e) => {
              const a = parseFloat(e.target.value);
              setZoom([a, a + (v1 - v0)]);
            }}
          />
        </div>
      ) : null}
    </Card>
  );
}
