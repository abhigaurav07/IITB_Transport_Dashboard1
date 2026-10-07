"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, Card, FieldLabel, useWidth } from "./ui";
import { ColorLegend } from "./Legend";
import type { View } from "./view";
import { drawDrive, makeGeo, secAt } from "./driveDraw";
import { fmt, fmtCh, tickStep } from "@/lib/iri/format";
import { conditionOf } from "@/lib/iri/rating";
import { colorCss, NO_DATA } from "@/lib/iri/scale";
import { blockLenM } from "@/lib/iri/routes";

function parseChainage(t: string): number | null {
  const s = t.trim();
  if (!s) return null;
  if (s.includes("+")) {
    const [a, b] = s.split("+");
    const k = parseFloat(a);
    const m = parseFloat(b || "0");
    return Number.isNaN(k) || Number.isNaN(m) ? null : k + m / 1000;
  }
  const k = parseFloat(s);
  return Number.isNaN(k) ? null : k;
}

export default function DriveTab({ v }: { v: View }) {
  const { route, cur } = v;
  const geo = useMemo(() => makeGeo(route), [route]);
  const [wrap, width] = useWidth<HTMLDivElement>();
  const canvas = useRef<HTMLCanvasElement>(null);
  const strip = useRef<HTMLCanvasElement>(null);
  const pos = useRef(geo.M[Math.min(cur, route.n - 2)] + 0.01);
  const fromDrive = useRef(cur);
  const raf = useRef<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(25);
  const [goText, setGoText] = useState("");
  const latest = useRef(v);
  useEffect(() => {
    latest.current = v;
  });

  const paint = useCallback(() => {
    const cv = canvas.current;
    if (!cv) return;
    const dpr = window.devicePixelRatio || 1;
    const W = cv.clientWidth || 900;
    const H = cv.clientHeight || 460;
    if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) {
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
    }
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const lv = latest.current;
    drawDrive(ctx, W, H, { g: geo, series: lv.series, avg: lv.route.avg, showAvgPill: lv.selection !== "avg", color: lv.color, pos: pos.current, cur: lv.cur });
  }, [geo]);

  // keep the camera on the block chosen elsewhere (profile, map, tables)
  useEffect(() => {
    if (cur !== fromDrive.current) {
      pos.current = geo.M[Math.min(cur, route.n - 2)] + 0.01;
      fromDrive.current = cur;
    }
    paint();
  }, [cur, geo, route.n, v.series, v.color, width, paint]);

  // slider strip
  useEffect(() => {
    const cv = strip.current;
    if (!cv) return;
    const dpr = window.devicePixelRatio || 1;
    const W = cv.clientWidth || 800;
    cv.width = W * dpr;
    cv.height = 18 * dpr;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = NO_DATA;
    ctx.fillRect(0, 0, W, 18);
    const total = route.km[route.n - 1];
    for (let i = 0; i < route.n - 1; i++) {
      const val = v.series[i];
      if (val == null) continue;
      ctx.fillStyle = colorCss(val, v.color);
      const x0 = (route.km[i] / total) * W;
      const x1 = (route.km[i + 1] / total) * W;
      ctx.fillRect(x0, 0, x1 - x0 + 0.6, 18);
    }
  }, [route, v.series, v.color, width]);

  // animation
  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    const loop = (ts: number) => {
      const dt = Math.min(0.1, (ts - last) / 1000);
      last = ts;
      pos.current += dt * speed;
      const end = geo.M[route.n - 1] - 1;
      if (pos.current >= end) {
        pos.current = end;
        setPlaying(false);
      }
      const c = Math.min(secAt(geo, pos.current), route.n - 2);
      if (c !== latest.current.cur) {
        fromDrive.current = c;
        latest.current.setCur(c, "drive");
      }
      paint();
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [playing, speed, geo, route.n, paint]);

  const jump = (i: number) => {
    const k = Math.max(0, Math.min(route.n - 2, i));
    setPlaying(false);
    pos.current = geo.M[k] + 0.01;
    fromDrive.current = k;
    v.setCur(k, "drive");
  };
  const go = () => {
    const km = parseChainage(goText);
    if (km == null) return;
    let lo = 0;
    let hi = route.n - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (route.km[mid] <= km) lo = mid + 1;
      else hi = mid;
    }
    jump(route.km[lo] <= km ? lo : lo - 1);
  };

  const i = Math.min(cur, route.n - 2);
  const sv = v.series[i];
  const a = route.avg[i];
  const total = route.km[route.n - 1];
  const ts = tickStep(total);
  const ticks: number[] = [];
  for (let k = 0; k < total - ts * 0.3; k += ts) ticks.push(k);
  ticks.push(total);

  return (
    <Card
      title="Drive-through view"
      subtitle="A first-person view along the route. You stand on one 50 m block at a time; the road ahead is coloured by the selected driver, or by the average of all drivers. Drag the slider to jump anywhere along the chainage."
    >
      <div ref={wrap} className="relative overflow-hidden rounded-lg border border-line bg-sky-100">
        <canvas ref={canvas} className="block h-[28rem] w-full" aria-label="First-person view of the road coloured by IRI" />
        <div className="pointer-events-none absolute inset-x-3 top-3 flex flex-wrap gap-2.5">
          <div className="min-w-[9.5rem] rounded-lg border border-slate-900/10 bg-white/95 px-3 py-2 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">Chainage</p>
            <p className="text-2xl font-semibold tabular-nums leading-tight text-ink">{fmtCh(route.km[i])}</p>
            <p className="text-[11px] text-ink-muted">
              Block {i + 1} · {fmtCh(route.km[i])} to {fmtCh(route.km[i + 1])} · {(blockLenM(route, i) ?? 0).toFixed(0)} m
            </p>
          </div>
          {v.selection !== "avg" ? (
            <div className="min-w-[8.5rem] rounded-lg border border-slate-900/10 bg-white/95 px-3 py-2 shadow-sm">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">{v.selectedLabel}</p>
              <p className="text-2xl font-semibold tabular-nums leading-tight text-ink">{fmt(sv)}</p>
              <p className="text-[11px] text-ink-muted">{conditionOf(sv, v.rating) ?? "not driven here"}</p>
            </div>
          ) : null}
          <div className="min-w-[8.5rem] rounded-lg border border-slate-900/10 bg-white/95 px-3 py-2 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
              Average of {route.nd[i]} driver{route.nd[i] === 1 ? "" : "s"}
            </p>
            <p className="text-2xl font-semibold tabular-nums leading-tight text-ink">{fmt(a)}</p>
            <p className="text-[11px] text-ink-muted">{route.nd[i] ? `range ${fmt(route.min[i])} to ${fmt(route.max[i])} · ${conditionOf(a, v.rating)}` : ""}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-x-5 gap-y-3">
        <div className="flex items-center gap-2">
          <Button onClick={() => jump(cur - 1)} ariaLabel="Back one block">◀ 50 m</Button>
          <Button variant="primary" onClick={() => setPlaying((p) => !p)}>{playing ? "❚❚ Pause" : "▶ Drive"}</Button>
          <Button onClick={() => jump(cur + 1)} ariaLabel="Forward one block">50 m ▶</Button>
        </div>
        <label className="flex items-center gap-2">
          <FieldLabel>Speed</FieldLabel>
          <select value={speed} onChange={(e) => setSpeed(+e.target.value)} className="rounded-lg border border-line bg-surface px-2.5 py-2 text-sm">
            <option value={5}>Walk · 5 m/s</option>
            <option value={25}>Drive · 25 m/s</option>
            <option value={60}>Fast · 60 m/s</option>
            <option value={150}>Very fast · 150 m/s</option>
          </select>
        </label>
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            go();
          }}
        >
          <FieldLabel>Go to chainage</FieldLabel>
          <input
            value={goText}
            onChange={(e) => setGoText(e.target.value)}
            placeholder="22+400"
            size={8}
            aria-label="Chainage to jump to"
            className="rounded-lg border border-line bg-surface px-2.5 py-2 text-sm tabular-nums"
          />
          <Button type="submit">Go</Button>
        </form>
      </div>

      <div className="relative mt-5 pb-1">
        <canvas ref={strip} className="block h-[18px] w-full rounded-full" aria-hidden />
        <input
          type="range"
          min={0}
          max={Math.max(1, route.n - 2)}
          step={1}
          value={i}
          onChange={(e) => jump(+e.target.value)}
          aria-label="Position along the chainage"
          aria-valuetext={`Chainage ${fmtCh(route.km[i])}`}
          className="iri-range absolute left-0 top-[-5px] h-7 w-full cursor-pointer appearance-none bg-transparent"
        />
        <div className="mt-2 flex justify-between text-[11px] tabular-nums text-ink-muted">
          {ticks.map((k) => (
            <span key={k}>{fmtCh(k)}</span>
          ))}
        </div>
      </div>
      <ColorLegend color={v.color} rating={v.rating} />
    </Card>
  );
}
