"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { td, tdNum, th, thNum, useWidth } from "./ui";
import { ColorLegend } from "./Legend";
import type { View } from "./view";
import { driverStats } from "@/lib/iri/stats";
import { fmtCh } from "@/lib/iri/format";
import { colorCss, NO_DATA } from "@/lib/iri/scale";

const L = 150;
const R = 8;
const ROW = 30;

/** One row per driver, one cell per block. Grey cells were not driven. */
export function CoverageChart({ v }: { v: View }) {
  const { route } = v;
  const [wrap, width] = useWidth<HTMLDivElement>();
  const cv = useRef<HTMLCanvasElement>(null);
  const rows = route.active.length;
  const H = 6 + rows * ROW + 26;

  const draw = useCallback(() => {
    const c = cv.current;
    if (!c || !width) return;
    const dpr = window.devicePixelRatio || 1;
    c.width = width * dpr;
    c.height = H * dpr;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, H);
    const total = route.km[route.n - 1];
    const x = (km: number) => L + (km / total) * (width - L - R);
    ctx.textBaseline = "middle";
    route.active.forEach((m, r) => {
      const yy = 6 + r * ROW;
      ctx.fillStyle = NO_DATA;
      ctx.fillRect(L, yy + 2, width - L - R, ROW - 4);
      for (let i = 0; i < route.n - 1; i++) {
        const val = m.iri[i];
        if (val == null) continue;
        ctx.fillStyle = colorCss(val, v.color);
        ctx.fillRect(x(route.km[i]), yy + 2, x(route.km[i + 1]) - x(route.km[i]) + 0.6, ROW - 4);
      }
      const sel = v.selection === m.ds.id;
      ctx.fillStyle = sel ? "#0f172a" : "#475569";
      ctx.font = `${sel ? "600 " : ""}12px Inter, system-ui, sans-serif`;
      ctx.textAlign = "right";
      let lb = m.label;
      while (ctx.measureText(lb).width > L - 14 && lb.length > 6) lb = lb.slice(0, -2);
      if (lb !== m.label) lb += "…";
      ctx.fillText(lb, L - 10, yy + ROW / 2);
    });
    ctx.fillStyle = "#64748b";
    ctx.font = "12px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    const step = total > 40 ? 10 : total > 15 ? 5 : total > 6 ? 2 : 1;
    for (let k = 0; k <= Math.floor(total); k += step) ctx.fillText(fmtCh(k), Math.max(L + 14, x(k)), H - 10);
    const cx = x(route.km[v.cur] + (v.cur < route.n - 1 ? (route.km[v.cur + 1] - route.km[v.cur]) / 2 : 0));
    ctx.strokeStyle = "#0f172a";
    ctx.globalAlpha = 0.75;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx, 6);
    ctx.lineTo(cx, 6 + rows * ROW);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }, [route, v.color, v.cur, v.selection, width, H, rows]);
  useEffect(() => draw(), [draw]);

  const pick = (clientX: number) => {
    const c = cv.current;
    if (!c) return;
    const r = c.getBoundingClientRect();
    const total = route.km[route.n - 1];
    const km = ((clientX - r.left - L) / (r.width - L - R)) * total;
    if (km < 0 || km > total) return;
    let lo = 0;
    let hi = route.n - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (route.km[mid] <= km) lo = mid + 1;
      else hi = mid;
    }
    v.setCur(Math.max(0, Math.min(route.n - 1, route.km[lo] <= km ? lo : lo - 1)));
  };

  return (
    <div>
      <div ref={wrap} className="rounded-xl border border-line bg-surface p-3">
        <canvas
          ref={cv}
          style={{ height: H, width: "100%" }}
          className="block"
          onPointerMove={(e) => pick(e.clientX)}
          onPointerDown={(e) => pick(e.clientX)}
          aria-label="Coverage of each driver along the chainage"
        />
      </div>
      <ColorLegend color={v.color} rating={v.rating} />
    </div>
  );
}

/** From which chainage each driver started, where the driver stopped, and how much road was covered. */
export function CoverageTable({ v }: { v: View }) {
  const { route, rating } = v;
  const total = route.km[route.n - 1];
  const stats = useMemo(() => route.active.map((m) => driverStats(route, m, rating)), [route, rating]);
  return (
    <div className="mt-4 overflow-x-auto rounded-xl border border-line bg-surface">
      <table className="w-full min-w-[640px]">
        <thead>
          <tr className="border-b border-line">
            <th className={th}>Driver</th>
            <th className={thNum}>Started at</th>
            <th className={thNum}>Ended at</th>
            <th className={thNum}>Road covered</th>
            <th className={thNum}>Share of route</th>
            <th className={thNum}>Blocks missing inside range</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {stats.map((s) => (
            <tr key={s.member.ds.id}>
              <td className={td}>
                <span className="mr-2 inline-block h-2.5 w-2.5 rounded-sm align-middle" style={{ background: s.member.color }} aria-hidden />
                {s.member.label}
              </td>
              <td className={tdNum}>{fmtCh(s.startKm)}</td>
              <td className={tdNum}>{fmtCh(s.endKm)}</td>
              <td className={tdNum}>{s.coveredKm.toFixed(1)} km</td>
              <td className={tdNum}>{total > 0 ? Math.round((100 * s.coveredKm) / total) : 0}%</td>
              <td className={tdNum}>{s.missing}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
