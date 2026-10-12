import type { Condition, Rating } from "@/lib/iri/types";
import { conditionOf } from "@/lib/iri/rating";

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

export function parseNsv(text: string): NsvBlock[] {
  const lines = text.trim().split(/\r?\n/);
  const head = lines[0].split(",");
  const col = (name: string) => head.indexOf(name);
  const c = {
    s: col("start_m"),
    e: col("end_m"),
    l: col("lwp_iri"),
    r: col("rwp_iri"),
    a: col("avg_iri"),
    b: col("bi"),
    v: col("speed_kmh"),
    la: col("lat"),
    lo: col("lon"),
    ela: col("end_lat"),
    elo: col("end_lon"),
  };
  return lines.slice(1).map((ln) => {
    const p = ln.split(",");
    return {
      startM: +p[c.s],
      endM: +p[c.e],
      lwp: +p[c.l],
      rwp: +p[c.r],
      avg: +p[c.a],
      bi: +p[c.b],
      speed: +p[c.v],
      lat: +p[c.la],
      lon: +p[c.lo],
      endLat: +p[c.ela],
      endLon: +p[c.elo],
    };
  });
}

export interface NsvSummary {
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

export function summariseNsv(b: NsvBlock[], r: Rating): NsvSummary {
  const v = b.map((x) => x.avg);
  const sorted = [...v].sort((p, q) => p - q);
  const lengthKm: Record<Condition, number> = { Good: 0, Fair: 0, Poor: 0 };
  let worst = 0;
  b.forEach((x, i) => {
    lengthKm[conditionOf(x.avg, r)!] += (x.endM - x.startM) / 1000;
    if (x.avg > b[worst].avg) worst = i;
  });
  const mid = sorted.length >> 1;
  return {
    startKm: b[0].startM / 1000,
    endKm: b[b.length - 1].endM / 1000,
    km: (b[b.length - 1].endM - b[0].startM) / 1000,
    blocks: b.length,
    mean: v.reduce((p, q) => p + q, 0) / v.length,
    median: sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2,
    lowest: sorted[0],
    highest: sorted[sorted.length - 1],
    worst,
    lengthKm,
  };
}

export const LWP_COLOR = "#1e40af";
export const RWP_COLOR = "#b45309";

/** Map colour range for the average IRI ramp (m/km). */
export const MAP_LO = 0.5;
export const MAP_HI = 4;
