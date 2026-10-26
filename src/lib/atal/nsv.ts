import type { Condition, Rating } from "@/lib/iri/types";
import { conditionOf } from "@/lib/iri/rating";
import { findCol, need, num, readTable } from "./table";

/** One 50 m block of the validated NSV data (the mean of five 10 m readings). */
export interface NsvBlock {
  startM: number;
  endM: number;
  lwp: number; // left wheel path IRI
  rwp: number; // right wheel path IRI
  avg: number; // (lwp + rwp) / 2
  bi: number; // bump integrator
  speed: number; // km/h
  lat: number;
  lon: number;
  endLat: number;
  endLon: number;
}

export const NSV_URL = "/data/atal-setu/nsv_50m.csv";
export const NSV_NAME = "NSV_Validated Data (50 m blocks)";
const BLOCK_M = 50;

const r3 = (x: number) => Math.round(x * 1000) / 1000;

/**
 * Reads an NSV file. Accepted layouts:
 *  - the raw NSV export: one row per 10 m with Start/End Chainage, LWP, RWP, BI, Speed, Latitude, Longitude;
 *    rows are averaged over each 50 m block (left and right wheel path separately, then (LWP + RWP) / 2);
 *  - a file that is already in 50 m blocks (either the raw layout with 50 m rows, or this dashboard's own CSV).
 */
export function parseNsv(text: string): NsvBlock[] {
  const t = readTable(text);
  const h = t.head;
  if (h.includes("start_m") && h.includes("lwp_iri")) return parsePrepared(t.rows, h);

  const c = {
    "Start Chainage": findCol(h, /start/),
    "End Chainage": findCol(h, /end/),
    "LWP IRI": findCol(h, /lwp/),
    "RWP IRI": findCol(h, /rwp/),
    Latitude: findCol(h, /^lat/),
    Longitude: findCol(h, /^lon/),
  };
  need(c, "NSV file");
  const cBi = findCol(h, /^bi$|bump/);
  const cSp = findCol(h, /speed/);

  interface Row { s: number; e: number; l: number; r: number; bi: number; sp: number; la: number; lo: number }
  let rows: Row[] = t.rows
    .map((p) => ({
      s: num(p[c["Start Chainage"]]),
      e: num(p[c["End Chainage"]]),
      l: num(p[c["LWP IRI"]]),
      r: num(p[c["RWP IRI"]]),
      bi: cBi >= 0 ? num(p[cBi]) : NaN,
      sp: cSp >= 0 ? num(p[cSp]) : NaN,
      la: num(p[c.Latitude]),
      lo: num(p[c.Longitude]),
    }))
    .filter((x) => [x.s, x.e, x.l, x.r, x.la, x.lo].every(Number.isFinite));
  if (rows.length < 5) throw new Error("NSV file: fewer than five valid rows.");
  const unit = Math.max(...rows.map((x) => x.e)) > 300 ? 1 : 1000; // metres or kilometres
  rows = rows.map((x) => ({ ...x, s: Math.round(x.s * unit), e: Math.round(x.e * unit) })).sort((a, b) => a.s - b.s);

  const lens = rows.map((x) => x.e - x.s).sort((a, b) => a - b);
  const median = lens[lens.length >> 1];
  const mean = (a: number[]) => {
    const v = a.filter(Number.isFinite);
    return v.length ? v.reduce((p, q) => p + q, 0) / v.length : 0;
  };

  // group the rows into 50 m blocks on the absolute 50 m chainage grid (rows that are already 50 m long stay as they are)
  const groups = new Map<number, Row[]>();
  for (const x of rows) {
    const key = median >= 40 ? x.s : Math.floor(x.s / BLOCK_M) * BLOCK_M;
    const g = groups.get(key);
    if (g) g.push(x);
    else groups.set(key, [x]);
  }
  const keys = [...groups.keys()].filter((k) => median >= 40 || groups.get(k)!.length >= 3).sort((a, b) => a - b);
  if (!keys.length) throw new Error("NSV file: no complete 50 m block found.");
  return keys.map((k, i) => {
    const g = groups.get(k)!;
    const next = groups.get(keys[i + 1]);
    const lwp = mean(g.map((x) => x.l));
    const rwp = mean(g.map((x) => x.r));
    const endM = median >= 40 ? Math.max(...g.map((x) => x.e)) : k + BLOCK_M;
    const contiguous = next && keys[i + 1] === endM;
    return {
      startM: k,
      endM,
      lwp: r3(lwp),
      rwp: r3(rwp),
      avg: r3((lwp + rwp) / 2),
      bi: Math.round(mean(g.map((x) => x.bi))),
      speed: Math.round(mean(g.map((x) => x.sp)) * 10) / 10,
      lat: g[0].la,
      lon: g[0].lo,
      endLat: contiguous ? next![0].la : g[g.length - 1].la,
      endLon: contiguous ? next![0].lo : g[g.length - 1].lo,
    };
  });
}

function parsePrepared(rows: string[][], head: string[]): NsvBlock[] {
  const c = (n: string) => head.indexOf(n);
  const ix = { s: c("start_m"), e: c("end_m"), l: c("lwp_iri"), r: c("rwp_iri"), a: c("avg_iri"), b: c("bi"), v: c("speed_kmh"), la: c("lat"), lo: c("lon"), ela: c("end_lat"), elo: c("end_lon") };
  return rows.map((p) => ({
    startM: +p[ix.s],
    endM: +p[ix.e],
    lwp: +p[ix.l],
    rwp: +p[ix.r],
    avg: +p[ix.a],
    bi: +p[ix.b],
    speed: +p[ix.v],
    lat: +p[ix.la],
    lon: +p[ix.lo],
    endLat: +p[ix.ela],
    endLon: +p[ix.elo],
  }));
}

export interface BlockSummary {
  startKm: number;
  endKm: number;
  km: number;
  blocks: number;
  mean: number;
  median: number;
  lowest: number;
  highest: number;
  worst: number; // index of the highest block
  lengthKm: Record<Condition, number>;
}

/** Summary of one value per block (starts and ends in metres). */
export function summariseBlocks(starts: number[], ends: number[], values: number[], r: Rating): BlockSummary {
  const sorted = [...values].sort((p, q) => p - q);
  const lengthKm: Record<Condition, number> = { Good: 0, Fair: 0, Poor: 0 };
  let worst = 0;
  values.forEach((v, i) => {
    lengthKm[conditionOf(v, r)!] += (ends[i] - starts[i]) / 1000;
    if (v > values[worst]) worst = i;
  });
  const mid = sorted.length >> 1;
  const n = starts.length;
  return {
    startKm: starts[0] / 1000,
    endKm: ends[n - 1] / 1000,
    km: (ends[n - 1] - starts[0]) / 1000,
    blocks: n,
    mean: values.reduce((p, q) => p + q, 0) / n,
    median: sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2,
    lowest: sorted[0],
    highest: sorted[n - 1],
    worst,
    lengthKm,
  };
}

export const summariseNsv = (b: NsvBlock[], r: Rating) =>
  summariseBlocks(b.map((x) => x.startM), b.map((x) => x.endM), b.map((x) => x.avg), r);

export const NSV_COLOR = "var(--chart-ink)";
export const MODEL_COLOR = "var(--series-model)";
export const LWP_COLOR = "var(--series-lwp)";
export const RWP_COLOR = "var(--series-rwp)";

/** Map colour range for the IRI ramp (m/km), the same for every map in this submodule. */
export const MAP_LO = 0.5;
export const MAP_HI = 4;
