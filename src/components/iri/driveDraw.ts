import type { Route } from "@/lib/iri/types";
import { colorRgb, mix, rgbCss, type ColorCtx, type RGB } from "@/lib/iri/scale";
import { fmt } from "@/lib/iri/format";

/** Route geometry in local metres, with chainage in metres, used by the first-person view. */
export interface Geo {
  M: number[];
  E: number[];
  N: number[];
}
export function makeGeo(r: Route): Geo {
  const kx = 111320 * Math.cos((r.lat[0] * Math.PI) / 180);
  const ky = 110574;
  return {
    M: r.km.map((k) => k * 1000),
    E: r.lon.map((l) => (l - r.lon[0]) * kx),
    N: r.lat.map((l) => (l - r.lat[0]) * ky),
  };
}
export function secAt(g: Geo, dm: number): number {
  let lo = 0;
  let hi = g.M.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (g.M[mid] <= dm) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}
function ptAt(g: Geo, dm: number) {
  const n = g.M.length;
  const d = Math.max(0, Math.min(g.M[n - 1] - 0.001, dm));
  const i = Math.min(secAt(g, d), n - 2);
  const u = (d - g.M[i]) / Math.max(1e-6, g.M[i + 1] - g.M[i]);
  return { e: g.E[i] + (g.E[i + 1] - g.E[i]) * u, n: g.N[i] + (g.N[i + 1] - g.N[i]) * u };
}

const SKY: [RGB, RGB] = [
  [168, 203, 232],
  [226, 236, 245],
];
const HOR: RGB = [226, 236, 245];
const ASPH: RGB = [62, 66, 72];

export interface DriveInput {
  g: Geo;
  series: (number | null)[];
  avg: (number | null)[];
  showAvgPill: boolean;
  color: ColorCtx;
  pos: number;
  cur: number;
}

export function drawDrive(ctx: CanvasRenderingContext2D, W: number, H: number, inp: DriveInput) {
  const { g, series, avg, color } = inp;
  const n = g.M.length;
  const f = W * 0.8;
  const hy = H * 0.38;
  const Hc = 2.4;
  const RW = 11;
  const LOOK = 720;
  const STEP = 3;
  const sky = ctx.createLinearGradient(0, 0, 0, hy);
  sky.addColorStop(0, rgbCss(SKY[0]));
  sky.addColorStop(1, rgbCss(SKY[1]));
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, hy + 1);
  const ground = ctx.createLinearGradient(0, hy, 0, H);
  ground.addColorStop(0, "#c9d3bd");
  ground.addColorStop(1, "#8ea177");
  ctx.fillStyle = ground;
  ctx.fillRect(0, hy, W, H - hy);

  const d = Math.max(0, Math.min(g.M[n - 1] - 1, inp.pos));
  const cur = secAt(g, d);
  const P = ptAt(g, d);
  const A = ptAt(g, d + 70);
  let fe = A.e - P.e;
  let fn = A.n - P.n;
  const fl = Math.hypot(fe, fn) || 1;
  fe /= fl;
  fn /= fl;
  const re = fn;
  const rn = -fe;
  interface S { dm: number; z: number; x: number; rx: number; rz: number; sec: number }
  const frame = (dm: number): Omit<S, "dm" | "sec"> => {
    const C = ptAt(g, dm);
    const a = ptAt(g, dm - 6);
    const b = ptAt(g, dm + 6);
    let te = b.e - a.e;
    let tn = b.n - a.n;
    const tl = Math.hypot(te, tn) || 1;
    te /= tl;
    tn /= tl;
    return { z: (C.e - P.e) * fe + (C.n - P.n) * fn, x: (C.e - P.e) * re + (C.n - P.n) * rn, rx: tn * re + -te * rn, rz: tn * fe + -te * fn };
  };
  const smp: S[] = [];
  for (let q = 2; q <= LOOK; q += STEP) {
    const dm = d + q;
    if (dm > g.M[n - 1]) break;
    smp.push({ dm, sec: secAt(g, dm), ...frame(dm) });
  }
  type Pt = { z: number; x: number; rx: number; rz: number };
  const proj = (p: Pt, L: number, h = 0): [number, number] | null => {
    const X = p.x + L * p.rx;
    const Z = p.z + L * p.rz;
    if (Z < 0.7) return null;
    return [W / 2 + (X * f) / Z, hy + ((Hc - h) * f) / Z];
  };
  const fog = (c: RGB, z: number): RGB => mix(c, HOR, Math.min(1, Math.pow(z / LOOK, 1.25)) * 0.85);
  const quad = (a: Pt, b: Pt, l1: number, l2: number, col: string, stroke?: string) => {
    const p1 = proj(a, l1);
    const p2 = proj(a, l2);
    const p3 = proj(b, l2);
    const p4 = proj(b, l1);
    if (!p1 || !p2 || !p3 || !p4) return;
    ctx.beginPath();
    ctx.moveTo(p1[0], p1[1]);
    ctx.lineTo(p2[0], p2[1]);
    ctx.lineTo(p3[0], p3[1]);
    ctx.lineTo(p4[0], p4[1]);
    ctx.closePath();
    ctx.fillStyle = col;
    ctx.fill();
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  };
  const white: RGB = [245, 245, 245];
  for (let k = smp.length - 2; k >= 0; k--) {
    const a = smp[k];
    const b = smp[k + 1];
    if (a.z < 0.7) continue;
    const base = colorRgb(series[a.sec], color);
    const road: RGB = base ? mix(ASPH, base, 0.82) : [96, 98, 102];
    quad(a, b, -RW / 2 - 3.5, RW / 2 + 3.5, rgbCss(fog([150, 150, 146], a.z)));
    quad(a, b, -RW / 2, RW / 2, rgbCss(fog(road, a.z)), a.sec === cur ? "rgba(255,255,255,.95)" : undefined);
    quad(a, b, -RW / 2 + 0.2, -RW / 2 + 0.5, rgbCss(fog(white, a.z)));
    quad(a, b, RW / 2 - 0.5, RW / 2 - 0.2, rgbCss(fog(white, a.z)));
    if (Math.floor(a.dm / 3) % 3 === 0) {
      quad(a, b, -RW / 6 - 0.08, -RW / 6 + 0.08, rgbCss(fog(white, a.z)));
      quad(a, b, RW / 6 - 0.08, RW / 6 + 0.08, rgbCss(fog(white, a.z)));
    }
  }
  // block gates, posts and value labels
  const labels: { n: number; j: number; p: Pt }[] = [];
  const gates: number[] = [];
  for (let j = cur + 1; j < n - 1 && g.M[j] - d < LOOK; j++) gates.push(j);
  for (let k = gates.length - 1; k >= 0; k--) {
    const j = gates[k];
    const p = frame(g.M[j]);
    if (p.z < 1.5 || p.z > 240) continue;
    const l = proj(p, -RW / 2);
    const r = proj(p, RW / 2);
    if (!l || !r) continue;
    ctx.strokeStyle = `rgba(255,255,255,${(0.9 - (0.6 * p.z) / 240).toFixed(2)})`;
    ctx.lineWidth = Math.max(1, (0.28 * f) / p.z);
    ctx.beginPath();
    ctx.moveTo(l[0], l[1]);
    ctx.lineTo(r[0], r[1]);
    ctx.stroke();
    for (const sd of [-1, 1]) {
      const b0 = proj(p, sd * (RW / 2 + 1.6), 0);
      const t0 = proj(p, sd * (RW / 2 + 1.6), 1.3);
      if (b0 && t0) {
        ctx.strokeStyle = rgbCss(fog([250, 250, 250], p.z));
        ctx.lineWidth = Math.max(1, (0.12 * f) / p.z);
        ctx.beginPath();
        ctx.moveTo(b0[0], b0[1]);
        ctx.lineTo(t0[0], t0[1]);
        ctx.stroke();
      }
    }
    if (k < 8 && p.z < 260) labels.push({ n: k, j, p });
  }
  const kept: { v: number | null; t1: string; t2: string; fs: number; tw: number; th: number; bx: number; by: number }[] = [];
  const boxes: number[][] = [];
  labels
    .sort((u, w) => u.n - w.n)
    .forEach(({ n: k, j, p }) => {
      const v = series[j];
      const pos = proj(p, RW / 2 + 2.2, 2.1);
      if (!pos) return;
      const fs = Math.max(11, Math.min(22, (2.6 * f) / p.z));
      const t1 = fmt(v, 2);
      const t2 = inp.showAvgPill && avg[j] != null && k < 3 ? `avg ${fmt(avg[j], 2)}` : "";
      ctx.font = `600 ${fs.toFixed(0)}px Inter, system-ui, sans-serif`;
      const tw = Math.max(ctx.measureText(t1).width, t2 ? ctx.measureText(t2).width * 0.8 : 0) + 14;
      const th = fs + (t2 ? fs * 0.85 : 0) + 8;
      const bx = pos[0] - 4;
      const by = pos[1] - th;
      if (boxes.some((o) => bx < o[0] + o[2] + 4 && bx + tw > o[0] - 4 && by < o[1] + o[3] + 4 && by + th > o[1] - 4)) return;
      boxes.push([bx, by, tw, th]);
      kept.push({ v, t1, t2, fs, tw, th, bx, by });
    });
  kept.reverse().forEach((k) => {
    const bg: RGB = k.v == null ? [120, 120, 120] : (colorRgb(k.v, color) as RGB);
    ctx.fillStyle = rgbCss(bg);
    ctx.strokeStyle = "rgba(255,255,255,.9)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(k.bx, k.by, k.tw, k.th, 6);
    else ctx.rect(k.bx, k.by, k.tw, k.th);
    ctx.fill();
    ctx.stroke();
    const lum = 0.299 * bg[0] + 0.587 * bg[1] + 0.114 * bg[2];
    ctx.fillStyle = lum > 150 ? "#111" : "#fff";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.font = `600 ${k.fs.toFixed(0)}px Inter, system-ui, sans-serif`;
    ctx.fillText(k.t1, k.bx + 7, k.by + 4);
    if (k.t2) {
      ctx.font = `500 ${(k.fs * 0.8).toFixed(0)}px Inter, system-ui, sans-serif`;
      ctx.fillText(k.t2, k.bx + 7, k.by + 4 + k.fs * 1.05);
    }
  });
  // chainage boards each km
  for (let km = Math.ceil(d / 1000); km * 1000 < d + LOOK && km * 1000 <= g.M[n - 1]; km++) {
    const dm = km * 1000;
    if (dm <= d + 4) continue;
    const p = frame(dm);
    const q = proj(p, -(RW / 2 + 4), 0);
    const t = proj(p, -(RW / 2 + 4), 3.4);
    if (!q || !t) continue;
    const w = (2.8 * f) / p.z;
    const h = (1.3 * f) / p.z;
    ctx.fillStyle = "#1d4ed8";
    ctx.fillRect(q[0] - w / 2, t[1], w, h);
    ctx.fillStyle = "#fff";
    ctx.font = `600 ${Math.max(9, (0.7 * f) / p.z).toFixed(0)}px Inter, system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${km}+000`, q[0], t[1] + h / 2);
    ctx.strokeStyle = "#555";
    ctx.lineWidth = Math.max(1, (0.1 * f) / p.z);
    ctx.beginPath();
    ctx.moveTo(q[0], t[1] + h);
    ctx.lineTo(q[0], q[1]);
    ctx.stroke();
  }
}
