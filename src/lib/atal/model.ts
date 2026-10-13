import { findCol, haversineM, need, num, readTable } from "./table";

/** One block of the model's predicted IRI. */
export interface ModelBlock {
  startM: number;
  endM: number;
  iri: number;
  speed: number; // km/h
  samples: number;
  lat: number;
  lon: number;
  endLat: number;
  endLon: number;
  lenM: number; // distance between the start and end coordinates
  devM: number; // lenM minus the labelled block length
}

export const MODEL_URL = "/data/atal-setu/predicted_iri_kalman.csv";
export const MODEL_NAME = "predicted_iri_kalman";
/** A block whose coordinates give a length this far from its label is treated as unreliable. */
export const LEN_TOL_M = 10;

export function parseModel(text: string): ModelBlock[] {
  const t = readTable(text);
  const h = t.head;
  const c = {
    "start chainage": findCol(h, /start.*chain/),
    "end chainage": findCol(h, /end.*chain/),
    "start latitude": findCol(h, /start.*lat/),
    "start longitude": findCol(h, /start.*lon/),
    "end latitude": findCol(h, /end.*lat/),
    "end longitude": findCol(h, /end.*lon/),
    "IRI value": findCol(h, /iri/),
  };
  need(c, "Predicted IRI file");
  const cSp = findCol(h, /speed/);
  const cN = findCol(h, /sample/);
  const raw = t.rows
    .map((p) => ({
      s: num(p[c["start chainage"]]),
      e: num(p[c["end chainage"]]),
      la: num(p[c["start latitude"]]),
      lo: num(p[c["start longitude"]]),
      ela: num(p[c["end latitude"]]),
      elo: num(p[c["end longitude"]]),
      v: num(p[c["IRI value"]]),
      sp: cSp >= 0 ? num(p[cSp]) : NaN,
      n: cN >= 0 ? num(p[cN]) : NaN,
    }))
    .filter((x) => [x.s, x.e, x.la, x.lo, x.ela, x.elo, x.v].every(Number.isFinite));
  if (raw.length < 2) throw new Error("Predicted IRI file: fewer than two valid rows.");
  const inMetres = /_m\b|\(m\)|\bm\b/.test(h[c["start chainage"]]) || Math.max(...raw.map((x) => x.e)) > 300;
  const unit = inMetres ? 1 : 1000;
  return raw
    .map((x) => {
      const startM = Math.round(x.s * unit);
      const endM = Math.round(x.e * unit);
      const lenM = haversineM(x.la, x.lo, x.ela, x.elo);
      return {
        startM,
        endM,
        iri: x.v,
        speed: Number.isFinite(x.sp) ? x.sp * 3.6 : NaN, // the file gives metres per second
        samples: Number.isFinite(x.n) ? x.n : 0,
        lat: x.la,
        lon: x.lo,
        endLat: x.ela,
        endLon: x.elo,
        lenM,
        devM: lenM - (endM - startM),
      };
    })
    .sort((a, b) => a.startM - b.startM);
}

export interface LengthCheck {
  buckets: { label: string; count: number; color: string }[];
  flagged: number[]; // indices of blocks more than LEN_TOL_M off
  labelledKm: number;
  coordKm: number;
}

export function lengthCheck(b: ModelBlock[]): LengthCheck {
  const edges: [string, number, string][] = [
    ["Within 2.5 m", 2.5, "#15803d"],
    ["2.5 to 5 m off", 5, "#65a30d"],
    ["5 to 10 m off", LEN_TOL_M, "#f59e0b"],
    ["More than 10 m off", Infinity, "#dc2626"],
  ];
  const buckets = edges.map(([label, , color]) => ({ label, count: 0, color }));
  const flagged: number[] = [];
  b.forEach((x, i) => {
    const d = Math.abs(x.devM);
    buckets[edges.findIndex(([, hi]) => d <= hi)].count++;
    if (d > LEN_TOL_M) flagged.push(i);
  });
  return {
    buckets,
    flagged,
    labelledKm: b.reduce((p, x) => p + (x.endM - x.startM), 0) / 1000,
    coordKm: b.reduce((p, x) => p + x.lenM, 0) / 1000,
  };
}
