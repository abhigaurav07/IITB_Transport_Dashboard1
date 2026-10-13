import type { NsvBlock } from "./nsv";
import { LEN_TOL_M, type ModelBlock } from "./model";
import { conditionOf } from "@/lib/iri/rating";
import type { Condition, Rating } from "@/lib/iri/types";

/**
 * The model's chainage does not match the NSV chainage (different start, and the model blocks are
 * placed by GPS). So each model block is located on the NSV route by position: its start and end
 * coordinates are projected onto the NSV route, which gives the NSV chainage it covers. Every 50 m
 * NSV block then takes the length-weighted mean of the model blocks that overlap it.
 */
export interface ModelPlacement {
  a: number; // NSV chainage (m) where the model block starts
  b: number; // NSV chainage (m) where it ends
  offRouteM: number; // largest distance of its end points from the NSV route
  usable: boolean;
}

export interface AlignedBlock {
  i: number; // index of the NSV block
  nsv: NsvBlock;
  model: number | null; // model IRI placed on this NSV block
  coverage: number; // share of the block covered by model blocks (0 to 1)
  uncertain: boolean; // leans on a model block whose coordinates are more than LEN_TOL_M off its length
  fromM: number | null; // model chainage range of the contributing blocks
  toM: number | null;
}

export interface Alignment {
  rows: AlignedBlock[];
  placement: ModelPlacement[];
  startShiftM: number | null; // NSV chainage minus model chainage at the first usable model block
  endShiftM: number | null; // the same at the last usable model block
  unplaced: number; // model blocks that could not be placed on the NSV route
}

export const MIN_COVERAGE = 0.5;
const OFF_ROUTE_M = 60;

export function align(nsv: NsvBlock[], model: ModelBlock[]): Alignment {
  const lat0 = nsv[0].lat;
  const kx = 111320 * Math.cos((lat0 * Math.PI) / 180);
  const ky = 110540;
  const X = (lon: number) => (lon - 72.85) * kx;
  const Y = (lat: number) => (lat - 18.9) * ky;
  const seg = nsv.map((b) => ({ x0: X(b.lon), y0: Y(b.lat), x1: X(b.endLon), y1: Y(b.endLat), s: b.startM, e: b.endM }));

  const project = (lat: number, lon: number) => {
    const px = X(lon);
    const py = Y(lat);
    let best = Infinity;
    let ch = seg[0].s;
    for (const g of seg) {
      const dx = g.x1 - g.x0;
      const dy = g.y1 - g.y0;
      const l2 = dx * dx + dy * dy;
      const u = l2 ? Math.max(0, Math.min(1, ((px - g.x0) * dx + (py - g.y0) * dy) / l2)) : 0;
      const qx = g.x0 + u * dx - px;
      const qy = g.y0 + u * dy - py;
      const d = qx * qx + qy * qy;
      if (d < best) {
        best = d;
        ch = g.s + u * (g.e - g.s);
      }
    }
    return { ch, d: Math.sqrt(best) };
  };

  const placement: ModelPlacement[] = model.map((m) => {
    const pa = project(m.lat, m.lon);
    const pb = project(m.endLat, m.endLon);
    return { a: pa.ch, b: pb.ch, offRouteM: Math.max(pa.d, pb.d), usable: pb.ch > pa.ch };
  });

  const rows: AlignedBlock[] = nsv.map((nb, i) => {
    let w = 0;
    let acc = 0;
    let uncertain = false;
    let from = Infinity;
    let to = -Infinity;
    model.forEach((m, j) => {
      const p = placement[j];
      if (!p.usable) return;
      const o = Math.min(nb.endM, p.b) - Math.max(nb.startM, p.a);
      if (o <= 0) return;
      w += o;
      acc += o * m.iri;
      if (Math.abs(m.devM) > LEN_TOL_M) uncertain = true;
      from = Math.min(from, m.startM);
      to = Math.max(to, m.endM);
    });
    const len = nb.endM - nb.startM;
    return {
      i,
      nsv: nb,
      model: w > 0 ? acc / w : null,
      coverage: Math.min(1, w / len),
      uncertain,
      fromM: w > 0 ? from : null,
      toM: w > 0 ? to : null,
    };
  });

  const inside = placement
    .map((p, j) => ({ p, m: model[j] }))
    .filter(({ p }) => p.usable && p.offRouteM <= OFF_ROUTE_M);
  const shift = (x: { p: ModelPlacement; m: ModelBlock } | undefined) => (x ? x.p.a - x.m.startM : null);
  return {
    rows,
    placement,
    startShiftM: shift(inside[0]),
    endShiftM: shift(inside[inside.length - 1]),
    unplaced: placement.filter((p) => !p.usable).length,
  };
}

/* ----- comparison statistics ----- */

export interface CompareStats {
  n: number;
  meanNsv: number;
  meanModel: number;
  bias: number; // mean of model minus NSV
  mae: number;
  rmse: number;
  pearson: number | null;
  spearman: number | null;
  sdNsv: number;
  sdModel: number;
  minModel: number;
  maxModel: number;
  agree: number; // share of blocks in the same condition class
  matrix: number[][]; // rows NSV class, columns model class (Good, Fair, Poor)
}

const mean = (v: number[]) => v.reduce((p, q) => p + q, 0) / v.length;
const sd = (v: number[]) => {
  const m = mean(v);
  return Math.sqrt(mean(v.map((x) => (x - m) ** 2)));
};
function pearson(x: number[], y: number[]): number | null {
  const mx = mean(x);
  const my = mean(y);
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (let i = 0; i < x.length; i++) {
    sxy += (x[i] - mx) * (y[i] - my);
    sxx += (x[i] - mx) ** 2;
    syy += (y[i] - my) ** 2;
  }
  return sxx > 1e-12 && syy > 1e-12 ? sxy / Math.sqrt(sxx * syy) : null;
}
function ranks(v: number[]): number[] {
  const idx = v.map((_, i) => i).sort((a, b) => v[a] - v[b]);
  const r = new Array<number>(v.length);
  let i = 0;
  while (i < idx.length) {
    let j = i;
    while (j + 1 < idx.length && v[idx[j + 1]] === v[idx[i]]) j++;
    for (let k = i; k <= j; k++) r[idx[k]] = (i + j) / 2 + 1;
    i = j + 1;
  }
  return r;
}

export const CLASSES: Condition[] = ["Good", "Fair", "Poor"];

export function compareStats(pairs: { nsv: number; model: number }[], rating: Rating): CompareStats | null {
  if (pairs.length < 3) return null;
  const x = pairs.map((p) => p.nsv);
  const y = pairs.map((p) => p.model);
  const d = pairs.map((p) => p.model - p.nsv);
  const matrix = [0, 1, 2].map(() => [0, 0, 0]);
  let agree = 0;
  pairs.forEach((p) => {
    const a = CLASSES.indexOf(conditionOf(p.nsv, rating)!);
    const b = CLASSES.indexOf(conditionOf(p.model, rating)!);
    matrix[a][b]++;
    if (a === b) agree++;
  });
  return {
    n: pairs.length,
    meanNsv: mean(x),
    meanModel: mean(y),
    bias: mean(d),
    mae: mean(d.map(Math.abs)),
    rmse: Math.sqrt(mean(d.map((v) => v * v))),
    pearson: pearson(x, y),
    spearman: pearson(ranks(x), ranks(y)),
    sdNsv: sd(x),
    sdModel: sd(y),
    minModel: Math.min(...y),
    maxModel: Math.max(...y),
    agree: agree / pairs.length,
    matrix,
  };
}
