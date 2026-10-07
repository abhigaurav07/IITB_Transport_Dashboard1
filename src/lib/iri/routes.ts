import type { Dataset, Member, Route, UploadedFile } from "./types";
import { DRIVER_COLORS } from "./scale";
import { fmtDate, fmtDateTime, letter } from "./format";

/** Reference points closer than this (degrees, about 2 m) count as the same point. */
const TOL = 2e-5;

function haversineM(la1: number, lo1: number, la2: number, lo2: number): number {
  const R = 6371000;
  const r = Math.PI / 180;
  const a = Math.sin(((la2 - la1) * r) / 2) ** 2 + Math.cos(la1 * r) * Math.cos(la2 * r) * Math.sin(((lo2 - lo1) * r) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

interface Group {
  datasets: Dataset[];
  pts: Map<number, [number, number]>;
}

/**
 * Groups datasets into routes by coordinates: two datasets share a route when at least 90 percent of
 * the reference indices they have in common sit at the same place (within about 2 m). Averages are
 * then taken per reference point, so every block is compared like with like.
 */
export function buildRoutes(files: UploadedFile[], names: Record<string, string>): Route[] {
  const all: Dataset[] = files.flatMap((f) => f.datasets);
  const includeOf = new Map<string, boolean>();
  files.forEach((f) => f.datasets.forEach((d) => includeOf.set(d.id, f.include)));
  const groups: Group[] = [];
  for (const d of all) {
    let best: Group | null = null;
    let bestOk = -1;
    for (const g of groups) {
      let shared = 0;
      let ok = 0;
      for (const r of d.rows) {
        const p = g.pts.get(r.r);
        if (p) {
          shared++;
          if (Math.abs(p[0] - r.lat) < TOL && Math.abs(p[1] - r.lon) < TOL) ok++;
        }
      }
      if (shared >= Math.min(10, d.rows.length) && ok / shared >= 0.9 && ok > bestOk) {
        best = g;
        bestOk = ok;
      }
    }
    if (!best) {
      best = { datasets: [], pts: new Map() };
      groups.push(best);
    }
    for (const r of d.rows) if (!best.pts.has(r.r)) best.pts.set(r.r, [r.lat, r.lon]);
    best.datasets.push(d);
  }
  return groups.map((g, gi) => makeRoute(g, gi, names, includeOf));
}

function makeRoute(g: Group, gi: number, names: Record<string, string>, includeOf: Map<string, boolean>): Route {
  const refs = [...g.pts.keys()].sort((a, b) => a - b);
  const n = refs.length;
  const pos = new Map<number, number>();
  refs.forEach((r, i) => pos.set(r, i));
  const lat = refs.map((r) => g.pts.get(r)![0]);
  const lon = refs.map((r) => g.pts.get(r)![1]);
  const km: number[] = [0];
  for (let i = 1; i < n; i++) km.push(km[i - 1] + haversineM(lat[i - 1], lon[i - 1], lat[i], lon[i]) / 1000);
  let gaps = 0;
  for (let i = 1; i < n; i++) if (refs[i] - refs[i - 1] !== 1) gaps++;

  const count: Record<string, number> = {};
  g.datasets.forEach((d) => (count[d.key] = (count[d.key] ?? 0) + 1));
  const members: Member[] = g.datasets.map((d, k) => {
    const iri: (number | null)[] = new Array(n).fill(null);
    const spd: (number | null)[] = new Array(n).fill(null);
    const time: (string | null)[] = new Array(n).fill(null);
    let maxDiffM = 0;
    for (const r of d.rows) {
      const p = pos.get(r.r)!;
      iri[p] = r.iri;
      spd[p] = r.spd;
      time[p] = r.t ? fmtDateTime(r.t) : null;
      maxDiffM = Math.max(maxDiffM, haversineM(lat[p], lon[p], r.lat, r.lon));
    }
    let label = `Driver ${d.key}`;
    if (count[d.key] > 1) label += ` (${d.date ? fmtDate(d.date) : d.fileName})`;
    return { ds: d, label, color: DRIVER_COLORS[k % DRIVER_COLORS.length], included: includeOf.get(d.id) ?? true, iri, spd, time, maxDiffM };
  });
  const seen: Record<string, number> = {};
  members.forEach((m) => (seen[m.label] = (seen[m.label] ?? 0) + 1));
  members.forEach((m) => {
    if (seen[m.label] > 1) m.label += ` · ${m.ds.fileName.replace(/\.[^.]*$/, "")}`;
  });

  const active = members.filter((m) => m.included);
  const avg: (number | null)[] = [];
  const min: (number | null)[] = [];
  const max: (number | null)[] = [];
  const nd: number[] = [];
  for (let i = 0; i < n; i++) {
    let s = 0;
    let c = 0;
    let a: number | null = null;
    let b: number | null = null;
    for (const m of active) {
      const v = m.iri[i];
      if (v != null) {
        s += v;
        c++;
        a = a == null ? v : Math.min(a, v);
        b = b == null ? v : Math.max(b, v);
      }
    }
    avg.push(c ? s / c : null);
    min.push(a);
    max.push(b);
    nd.push(c);
  }
  const named = g.datasets.find((d) => names[d.id]);
  return {
    id: g.datasets[0].id,
    name: named ? names[named.id] : `Route ${letter(gi)}`,
    idx: gi,
    n,
    lat,
    lon,
    km,
    refs,
    gaps,
    members,
    active,
    avg,
    min,
    max,
    nd,
  };
}

/** Length of block i in metres (null for the last reference point, which only ends the route). */
export const blockLenM = (r: Route, i: number): number | null => (i < r.n - 1 ? (r.km[i + 1] - r.km[i]) * 1000 : null);
export const routeLengthKm = (r: Route) => r.km[r.n - 1];
