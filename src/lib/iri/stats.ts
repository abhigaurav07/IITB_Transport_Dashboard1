import type { Condition, Member, Rating, Route } from "./types";
import { blockLenM } from "./routes";
import { conditionOf } from "./rating";
import { fmtDate } from "./format";

export interface Summary {
  blocks: number;
  km: number;
  mean: number;
  median: number;
  lowest: number;
  highest: number;
  worst: number; // block index
  lengthKm: Record<Condition, number>;
  coveredKm: number;
  poorShare: number;
}

export function summarise(r: Route, rating: Rating): Summary | null {
  const vals: number[] = [];
  const lengthKm: Record<Condition, number> = { Good: 0, Fair: 0, Poor: 0 };
  let sum = 0;
  let worst = -1;
  let covered = 0;
  for (let i = 0; i < r.n - 1; i++) {
    const v = r.avg[i];
    if (v == null) continue;
    const l = (blockLenM(r, i) ?? 0) / 1000;
    lengthKm[conditionOf(v, rating)!] += l;
    covered += l;
    sum += v;
    vals.push(v);
    if (worst < 0 || v > (r.avg[worst] as number)) worst = i;
  }
  if (!vals.length) return null;
  const sorted = [...vals].sort((a, b) => a - b);
  return {
    blocks: vals.length,
    km: r.km[r.n - 1],
    mean: sum / vals.length,
    median: sorted[Math.floor(sorted.length / 2)],
    lowest: sorted[0],
    highest: sorted[sorted.length - 1],
    worst,
    lengthKm,
    coveredKm: covered,
    poorShare: covered ? lengthKm.Poor / covered : 0,
  };
}

export interface Stretch {
  from: number;
  to: number;
  first: number;
  mean: number;
  poorShare: number;
  highest: number;
}
export function stretchStep(totalKm: number) {
  return totalKm > 30 ? 5 : totalKm > 10 ? 2 : 1;
}
export function stretches(r: Route, rating: Rating): Stretch[] {
  const total = r.km[r.n - 1];
  const step = stretchStep(total);
  const out: Stretch[] = [];
  for (let a = 0; a < total; a += step) {
    const b = Math.min(a + step, total);
    let s = 0;
    let c = 0;
    let mx = -Infinity;
    let lp = 0;
    let lt = 0;
    let first = -1;
    for (let i = 0; i < r.n - 1; i++) {
      const v = r.avg[i];
      if (v == null || r.km[i] < a || r.km[i] >= b) continue;
      if (first < 0) first = i;
      s += v;
      c++;
      mx = Math.max(mx, v);
      const l = blockLenM(r, i) ?? 0;
      lt += l;
      if (v > rating.fair) lp += l;
    }
    if (c) out.push({ from: a, to: b, first, mean: s / c, poorShare: lt ? lp / lt : 0, highest: mx });
  }
  return out;
}

export function topBlocks(r: Route, count = 10): number[] {
  const idx: number[] = [];
  for (let i = 0; i < r.n - 1; i++) if (r.avg[i] != null) idx.push(i);
  return idx.sort((a, b) => (r.avg[b] as number) - (r.avg[a] as number)).slice(0, count);
}

export interface DriverStat {
  member: Member;
  date: string;
  startKm: number;
  /** Chainage where the last block with a value ends. */
  endKm: number;
  /** Length of road with a value, in km. */
  coveredKm: number;
  n: number;
  missing: number;
  mean: number;
  median: number;
  max: number;
  poor: number;
}
export function driverStats(r: Route, m: Member, rating: Rating): DriverStat {
  let first = -1;
  let last = -1;
  const vals: number[] = [];
  let covered = 0;
  for (let i = 0; i < r.n; i++) {
    const v = m.iri[i];
    if (v != null) {
      if (first < 0) first = i;
      last = i;
      vals.push(v);
      if (i < r.n - 1) covered += r.km[i + 1] - r.km[i];
    }
  }
  const sorted = [...vals].sort((a, b) => a - b);
  const n = vals.length;
  return {
    member: m,
    date: m.ds.date ? fmtDate(m.ds.date) : "not given",
    startKm: r.km[first],
    endKm: r.km[Math.min(last + 1, r.n - 1)],
    coveredKm: covered,
    n,
    missing: last - first + 1 - n,
    mean: vals.reduce((a, b) => a + b, 0) / n,
    median: sorted[Math.floor(n / 2)],
    max: sorted[n - 1],
    poor: vals.filter((x) => x > rating.fair).length / n,
  };
}

export function routeOverview(r: Route, rating: Rating) {
  const s = summarise(r, rating);
  return { km: r.km[r.n - 1], blocks: s?.blocks ?? 0, active: r.active.length, total: r.members.length, mean: s?.mean ?? null, poor: s ? s.poorShare : null };
}
