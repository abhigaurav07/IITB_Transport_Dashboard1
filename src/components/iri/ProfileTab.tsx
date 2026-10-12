"use client";

import { useMemo, useRef, useState, type PointerEvent } from "react";
import { Button, Card, useWidth } from "./ui";
import { BlockLine } from "./BlockReadout";
import { CoverageChart, CoverageTable } from "./CoverageChart";
import type { View } from "./view";
import { fmtCh } from "@/lib/iri/format";

const H = 340;
const M = { l: 48, r: 44, t: 14, b: 34 };
const INK = "#0f172a";
const AXIS = "#334155";
const GRID = "#e2e8f0";
const BAND = "#334155";
const POOR = "#b91c1c";
const GOOD = "#15803d";
const MIN_SPAN_KM = 0.25;

function niceStep(span: number, target = 8): number {
  const raw = span / target;
  const p = Math.pow(10, Math.floor(Math.log10(raw)));
  const f = raw / p;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p;
}

export default function ProfileTab({ v }: { v: View }) {
  const { route, rating, cur } = v;
  const [ref, width] = useWidth<HTMLDivElement>();
  const W = Math.max(320, width);
  const total = route.km[route.n - 1];
  const [zoom, setZoom] = useState<[number, number] | null>(null);
  const [drag, setDrag] = useState<{ a: number; b: number } | null>(null);
  const press = useRef<{ x: number; moved: boolean } | null>(null);

  const [v0, v1] = zoom && zoom[0] >= 0 && zoom[1] <= total ? zoom : [0, total];
  const zoomed = v0 > 0.0005 || v1 < total - 0.0005;

  const x = (km: number) => M.l + ((km - v0) / (v1 - v0)) * (W - M.l - M.r);
  const kmAt = (px: number) => v0 + ((px - M.l) / (W - M.l - M.r)) * (v1 - v0);

  const idxAt = (km: number) => {
    let a = 0;
    let b = route.n - 1;
    while (a < b) {
      const mid = (a + b) >> 1;
      if (route.km[mid] <= km) a = mid + 1;
      else b = mid;
    }
    return Math.max(0, Math.min(route.n - 1, route.km[a] <= km ? a : a - 1));
  };
  const iLo = Math.max(0, idxAt(v0) - 1);
  const iHi = Math.min(route.n - 1, idxAt(v1) + 1);

  // vertical range: fixed for the whole route, fitted to the visible stretch when zoomed
  const { y0, y1 } = useMemo(() => {
    let lo = Infinity;
    let hi = -Infinity;
    const take = (val: number | null) => {
      if (val != null) {
        if (val < lo) lo = val;
        if (val > hi) hi = val;
      }
    };
    const from = zoomed ? iLo : 0;
    const to = zoomed ? iHi : route.n - 1;
    for (let k = from; k <= to; k++) {
      take(route.min[k]);
      take(route.max[k]);
      take(v.series[k]);
    }
    if (!isFinite(lo)) return { y0: 0, y1: 5 };
    if (!zoomed) return { y0: Math.min(2.5, Math.floor(lo * 2) / 2), y1: Math.max(5, Math.ceil(hi * 2) / 2) };
    const pad = Math.max(0.15, (hi - lo) * 0.12);
    return { y0: Math.floor((lo - pad) * 10) / 10, y1: Math.ceil((hi + pad) * 10) / 10 };
  }, [route, v.series, zoomed, iLo, iHi]);

  const y = (val: number) => M.t + ((y1 - val) / (y1 - y0)) * (H - M.t - M.b);
  const yc = (val: number) => Math.max(M.t, Math.min(H - M.b, y(val)));

  const paths = useMemo(() => {
    const step = (s: (number | null)[]) => {
      let d = "";
      let pen = false;
      for (let k = iLo; k <= iHi; k++) {
        const val = s[k];
        if (val == null || k >= route.n - 1) {
          pen = false;
          continue;
        }
        const xa = x(route.km[k]).toFixed(1);
        const xb = x(route.km[k + 1]).toFixed(1);
        const yy = y(Math.min(val, y1)).toFixed(1);
        d += `${pen ? "L" : "M"}${xa},${yy}L${xb},${yy}`;
        pen = true;
      }
      return d;
    };
    let band = "";
    let i = iLo;
    while (i <= iHi) {
      if (route.max[i] == null || i >= route.n - 1) {
        i++;
        continue;
      }
      let j = i;
      while (j <= iHi && j < route.n - 1 && route.max[j] != null) j++;
      let top = "";
      let bot = "";
      for (let k = i; k < j; k++) {
        const xa = x(route.km[k]).toFixed(1);
        const xb = x(route.km[k + 1]).toFixed(1);
        const yy = y(Math.min(route.max[k] as number, y1)).toFixed(1);
        top += `${k === i ? "M" : "L"}${xa},${yy}L${xb},${yy}`;
      }
      for (let k = j - 1; k >= i; k--) {
        const xa = x(route.km[k]).toFixed(1);
        const xb = x(route.km[k + 1]).toFixed(1);
        const yy = y(Math.min(route.min[k] as number, y1)).toFixed(1);
        bot += `L${xb},${yy}L${xa},${yy}`;
      }
      band += `${top}${bot}Z`;
      i = j;
    }
    return { avg: step(route.avg), sel: v.selection === "avg" ? "" : step(v.series), band };
    // x and y depend only on the values listed here
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route, v.series, v.selection, W, v0, v1, y0, y1, iLo, iHi]);

  /* ----- zoom controls ----- */
  const setRange = (a: number, b: number) => {
    let lo = Math.max(0, Math.min(a, b));
    let hi = Math.min(total, Math.max(a, b));
    if (hi - lo < MIN_SPAN_KM) {
      const c = (lo + hi) / 2;
      lo = Math.max(0, c - MIN_SPAN_KM / 2);
      hi = Math.min(total, lo + MIN_SPAN_KM);
      lo = Math.max(0, hi - MIN_SPAN_KM);
    }
    setZoom(hi - lo >= total - 0.0005 ? null : [lo, hi]);
  };
  const zoomBy = (factor: number) => {
    const c = Math.max(v0, Math.min(v1, route.km[cur] ?? (v0 + v1) / 2));
    const half = ((v1 - v0) * factor) / 2;
    const mid = c > v0 + half && c < v1 - half ? c : (v0 + v1) / 2;
    setRange(mid - half, mid + half);
  };

  /* ----- pointer: hover reads a block, drag zooms into the dragged stretch ----- */
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
    v.setCur(idxAt(kmAt(px)));
  };
  const onUp = (e: PointerEvent<SVGRectElement>) => {
    const p = press.current;
    press.current = null;
    setDrag(null);
    if (!p) return;
    const px = localX(e);
    if (p.moved && Math.abs(px - p.x) >= 14) setRange(kmAt(p.x), kmAt(px));
    else v.setCur(idxAt(kmAt(px)));
  };

  const ts = niceStep(v1 - v0);
  const xTicks: number[] = [];
  for (let k = Math.ceil(v0 / ts) * ts; k <= v1 + 1e-9; k += ts) xTicks.push(Math.round(k * 1e6) / 1e6);
  const ys = niceStep(y1 - y0, 6);
  const yTicks: number[] = [];
  for (let t = Math.ceil(y0 / ys) * ys; t <= y1 + 1e-9; t += ys) yTicks.push(Math.round(t * 1e6) / 1e6);
  const cx = x(route.km[cur] + (cur < route.n - 1 ? (route.km[cur + 1] - route.km[cur]) / 2 : 0));
  const cav = route.avg[cur];
  const selColor = v.selection === "avg" ? INK : route.members.find((m) => m.ds.id === v.selection)?.color ?? INK;
  const plotW = W - M.l - M.r;

  return (
    <div className="space-y-5">
    <Card
      title="Average IRI along the chainage"
      action={
        <div className="flex flex-wrap items-center justify-end gap-2">
          {zoomed ? <span className="mr-1 text-xs tabular-nums text-ink-muted">{fmtCh(v0)} to {fmtCh(v1)}</span> : <span className="mr-1 hidden text-xs text-ink-muted sm:inline">Drag on the graph to zoom</span>}
          <Button size="sm" onClick={() => zoomBy(0.5)} ariaLabel="Zoom in">Zoom in</Button>
          <Button size="sm" onClick={() => zoomBy(2)} disabled={!zoomed} ariaLabel="Zoom out">Zoom out</Button>
          <Button size="sm" variant="primary" onClick={() => setZoom(null)} disabled={!zoomed} ariaLabel="Reset zoom">Reset</Button>
        </div>
      }
    >
      <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-ink">
        <span className="inline-flex items-center gap-2"><span className="h-[3px] w-5 rounded bg-ink" />Average of all drivers</span>
        {v.selection !== "avg" ? <span className="inline-flex items-center gap-2"><span className="h-[3px] w-5 rounded" style={{ background: selColor }} />{v.selectedLabel}</span> : null}
        <span className="inline-flex items-center gap-2"><span className="h-3 w-5 rounded-sm" style={{ background: BAND, opacity: 0.28 }} />Lowest to highest driver</span>
        <span className="inline-flex items-center gap-2"><span className="w-5 border-t-2 border-dashed" style={{ borderColor: POOR }} />Poor above {rating.fair.toFixed(2)}</span>
        <span className="inline-flex items-center gap-2"><span className="w-5 border-t-2 border-dashed" style={{ borderColor: GOOD }} />Good below {rating.good.toFixed(2)}</span>
      </div>
      <div ref={ref} className="w-full">
        <svg width={W} height={H} role="img" aria-label="Average IRI of each 50 m block along the chainage" className="block max-w-full select-none">
          <defs>
            <clipPath id="iri-plot-clip">
              <rect x={M.l} y={M.t} width={Math.max(0, plotW)} height={H - M.t - M.b} />
            </clipPath>
          </defs>
          <rect x={M.l} y={M.t} width={Math.max(0, plotW)} height={H - M.t - M.b} fill="#ffffff" stroke={GRID} />
          {yTicks.map((t) => (
            <g key={t}>
              <line x1={M.l} x2={W - M.r} y1={y(t)} y2={y(t)} stroke={GRID} />
              <text x={M.l - 8} y={y(t) + 4} textAnchor="end" fontSize={11} fill={AXIS}>{Number.isInteger(t) ? t : t.toFixed(1)}</text>
            </g>
          ))}
          {xTicks.map((k) => (
            <g key={k}>
              <line x1={x(k)} x2={x(k)} y1={M.t} y2={H - M.b} stroke={GRID} />
              <text x={x(k)} y={H - 12} textAnchor="middle" fontSize={11} fill={AXIS}>{fmtCh(k)}</text>
            </g>
          ))}
          <g clipPath="url(#iri-plot-clip)">
            <path d={paths.band} fill={BAND} opacity={0.26} />
            {[
              [rating.good, GOOD],
              [rating.fair, POOR],
            ].map(([t, c]) =>
              (t as number) >= y0 && (t as number) <= y1 ? <line key={c as string} x1={M.l} x2={W - M.r} y1={y(t as number)} y2={y(t as number)} stroke={c as string} strokeWidth={1.6} strokeDasharray="6 4" /> : null,
            )}
            {paths.sel ? <path d={paths.sel} fill="none" stroke={selColor} strokeWidth={zoomed ? 2.2 : 1.6} opacity={0.95} /> : null}
            <path d={paths.avg} fill="none" stroke={INK} strokeWidth={zoomed ? 2.4 : 1.9} strokeLinejoin="round" />
            {cx >= M.l && cx <= W - M.r ? (
              <>
                <line x1={cx} x2={cx} y1={M.t} y2={H - M.b} stroke={INK} opacity={0.6} />
                {cav != null ? <circle cx={cx} cy={yc(Math.min(cav, y1))} r={5} fill="#fff" stroke={INK} strokeWidth={2.2} /> : null}
              </>
            ) : null}
          </g>
          {[
            [rating.good, GOOD],
            [rating.fair, POOR],
          ].map(([t, c]) =>
            (t as number) >= y0 && (t as number) <= y1 ? (
              <text key={c as string} x={W - M.r + 5} y={y(t as number) + 4} fontSize={11} fontWeight={600} fill={c as string}>{(t as number).toFixed(2)}</text>
            ) : null,
          )}
          {drag ? (
            <rect x={Math.max(M.l, Math.min(drag.a, drag.b))} y={M.t} width={Math.min(W - M.r, Math.max(drag.a, drag.b)) - Math.max(M.l, Math.min(drag.a, drag.b))} height={H - M.t - M.b} fill="#1d4ed8" opacity={0.14} stroke="#1d4ed8" />
          ) : null}
          <rect
            x={M.l}
            y={M.t}
            width={Math.max(0, plotW)}
            height={H - M.t - M.b}
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
            min={0}
            max={Math.max(0.001, total - (v1 - v0))}
            step={0.01}
            value={v0}
            onChange={(e) => {
              const a = parseFloat(e.target.value);
              setZoom([a, a + (v1 - v0)]);
            }}
          />
        </div>
      ) : null}
      <BlockLine v={v} />
    </Card>
    <Card title="Coverage by driver" subtitle="Grey means not driven.">
      <CoverageChart v={v} />
      <CoverageTable v={v} />
    </Card>
    </div>
  );
}
