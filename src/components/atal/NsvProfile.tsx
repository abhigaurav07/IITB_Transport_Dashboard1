"use client";

import { useMemo, useRef, useState, type PointerEvent } from "react";
import { Button, Card, useWidth } from "@/components/iri/ui";
import { LWP_COLOR, RWP_COLOR, type NsvBlock } from "@/lib/atal/nsv";
import { fmtCh } from "@/lib/iri/format";
import type { Rating } from "@/lib/iri/types";

const H = 340;
const M = { l: 48, r: 44, t: 14, b: 34 };
const INK = "#0f172a";
const AXIS = "#334155";
const GRID = "#e2e8f0";
const POOR = "#b91c1c";
const GOOD = "#15803d";
const MIN_SPAN_KM = 0.25;

function niceStep(span: number, target = 8): number {
  const raw = span / target;
  const p = Math.pow(10, Math.floor(Math.log10(raw)));
  const f = raw / p;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p;
}

type SeriesKey = "lwp" | "rwp";

export default function NsvProfile({ blocks, cur, setCur, rating }: { blocks: NsvBlock[]; cur: number; setCur: (i: number) => void; rating: Rating }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const W = Math.max(320, width);
  const n = blocks.length;
  const t0 = blocks[0].startM / 1000;
  const t1 = blocks[n - 1].endM / 1000;
  const [zoom, setZoom] = useState<[number, number] | null>(null);
  const [drag, setDrag] = useState<{ a: number; b: number } | null>(null);
  const [show, setShow] = useState<Record<SeriesKey, boolean>>({ lwp: false, rwp: false });
  const press = useRef<{ x: number; moved: boolean } | null>(null);

  const [v0, v1] = zoom && zoom[0] >= t0 && zoom[1] <= t1 ? zoom : [t0, t1];
  const zoomed = v0 > t0 + 0.0005 || v1 < t1 - 0.0005;
  const plotW = W - M.l - M.r;

  const x = (km: number) => M.l + ((km - v0) / (v1 - v0)) * plotW;
  const kmAt = (px: number) => v0 + ((px - M.l) / plotW) * (v1 - v0);
  const idxAt = (km: number) => Math.max(0, Math.min(n - 1, Math.floor((km * 1000 - blocks[0].startM) / 50)));
  const iLo = Math.max(0, idxAt(v0) - 1);
  const iHi = Math.min(n - 1, idxAt(v1) + 1);

  const { y0, y1 } = useMemo(() => {
    let lo = Infinity;
    let hi = -Infinity;
    const from = zoomed ? iLo : 0;
    const to = zoomed ? iHi : n - 1;
    for (let k = from; k <= to; k++) {
      const b = blocks[k];
      const vals = [b.avg, ...(show.lwp ? [b.lwp] : []), ...(show.rwp ? [b.rwp] : [])];
      for (const val of vals) {
        if (val < lo) lo = val;
        if (val > hi) hi = val;
      }
    }
    if (!isFinite(lo)) return { y0: 0, y1: 5 };
    if (!zoomed) return { y0: 0, y1: Math.max(5, Math.ceil(hi)) };
    const pad = Math.max(0.15, (hi - lo) * 0.12);
    return { y0: Math.max(0, Math.floor((lo - pad) * 10) / 10), y1: Math.ceil((hi + pad) * 10) / 10 };
  }, [blocks, n, show, zoomed, iLo, iHi]);

  const y = (val: number) => M.t + ((y1 - val) / (y1 - y0)) * (H - M.t - M.b);

  const path = (get: (b: NsvBlock) => number) => {
    let d = "";
    for (let k = iLo; k <= iHi; k++) {
      const b = blocks[k];
      const yy = y(Math.min(get(b), y1)).toFixed(1);
      d += `${k === iLo ? "M" : "L"}${x(b.startM / 1000).toFixed(1)},${yy}L${x(b.endM / 1000).toFixed(1)},${yy}`;
    }
    return d;
  };

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
    const cc = (blocks[cur].startM + blocks[cur].endM) / 2000;
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
  const ys = niceStep(y1 - y0, 6);
  const yTicks: number[] = [];
  for (let t = Math.ceil(y0 / ys) * ys; t <= y1 + 1e-9; t += ys) yTicks.push(Math.round(t * 1e6) / 1e6);
  const cb = blocks[cur];
  const cx = x((cb.startM + cb.endM) / 2000);
  const thresholds: [number, string][] = [
    [rating.good, GOOD],
    [rating.fair, POOR],
  ];
  const chip = (k: SeriesKey, label: string, color: string) => (
    <button
      type="button"
      aria-pressed={show[k]}
      onClick={() => setShow((s) => ({ ...s, [k]: !s[k] }))}
      className={`inline-flex items-center gap-2 rounded-lg border-[1.5px] px-2.5 py-1 text-xs font-medium transition-colors ${show[k] ? "border-primary bg-primary-50 text-primary" : "border-primary/45 bg-surface text-ink hover:border-primary"}`}
    >
      <span className="h-[3px] w-4 rounded" style={{ background: color }} />
      {label}
    </button>
  );

  return (
    <Card
      title="NSV IRI along the chainage"
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
      <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-ink">
        <span className="inline-flex items-center gap-2"><span className="h-[3px] w-5 rounded bg-ink" />Average IRI</span>
        {chip("lwp", "Left wheel path", LWP_COLOR)}
        {chip("rwp", "Right wheel path", RWP_COLOR)}
        <span className="inline-flex items-center gap-2"><span className="w-5 border-t-2 border-dashed" style={{ borderColor: POOR }} />Poor above {rating.fair.toFixed(2)}</span>
        <span className="inline-flex items-center gap-2"><span className="w-5 border-t-2 border-dashed" style={{ borderColor: GOOD }} />Good below {rating.good.toFixed(2)}</span>
      </div>
      <div ref={ref} className="w-full">
        <svg width={W} height={H} role="img" aria-label="NSV IRI of each 50 m block along the chainage" className="block max-w-full select-none">
          <defs>
            <clipPath id="nsv-plot-clip">
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
          <g clipPath="url(#nsv-plot-clip)">
            {thresholds.map(([t, c]) =>
              t >= y0 && t <= y1 ? <line key={c} x1={M.l} x2={W - M.r} y1={y(t)} y2={y(t)} stroke={c} strokeWidth={1.6} strokeDasharray="6 4" /> : null,
            )}
            {show.lwp ? <path d={path((b) => b.lwp)} fill="none" stroke={LWP_COLOR} strokeWidth={zoomed ? 1.8 : 1.3} opacity={0.9} /> : null}
            {show.rwp ? <path d={path((b) => b.rwp)} fill="none" stroke={RWP_COLOR} strokeWidth={zoomed ? 1.8 : 1.3} opacity={0.9} /> : null}
            <path d={path((b) => b.avg)} fill="none" stroke={INK} strokeWidth={zoomed ? 2.4 : 1.9} strokeLinejoin="round" />
            {cx >= M.l && cx <= W - M.r ? (
              <>
                <line x1={cx} x2={cx} y1={M.t} y2={H - M.b} stroke={INK} opacity={0.6} />
                <circle cx={cx} cy={y(Math.min(cb.avg, y1))} r={5} fill="#fff" stroke={INK} strokeWidth={2.2} />
              </>
            ) : null}
          </g>
          {thresholds.map(([t, c]) =>
            t >= y0 && t <= y1 ? <text key={c} x={W - M.r + 5} y={y(t) + 4} fontSize={11} fontWeight={600} fill={c}>{t.toFixed(2)}</text> : null,
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
