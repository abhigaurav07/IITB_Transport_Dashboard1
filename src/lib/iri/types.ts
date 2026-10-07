/** One parsed CSV row after validation. `iri` is null when the file leaves the value blank. */
export interface RawRow {
  r: number; // reference point index (ref_idx)
  lat: number;
  lon: number;
  iri: number | null;
  spd: number | null; // km/h
  t: Date | null;
}

/** One driver's trip inside one file. A file normally holds one driver. */
export interface Dataset {
  id: string;
  fileId: number;
  fileName: string;
  key: string; // driver_key
  rows: RawRow[];
  nv: number; // number of rows that carry an IRI value
  date: Date | null;
}

export interface UploadedFile {
  id: number;
  name: string;
  hash: string;
  include: boolean;
  demo: boolean;
  datasets: Dataset[];
}

/** A dataset placed on a route: its values aligned to the route's reference points. */
export interface Member {
  ds: Dataset;
  label: string;
  color: string;
  included: boolean;
  iri: (number | null)[];
  spd: (number | null)[];
  time: (string | null)[];
  maxDiffM: number;
}

/**
 * A route is the set of datasets whose reference points coincide.
 * All arrays are indexed by position along the route, so index i is
 * the block that starts at reference point i and ends at point i + 1.
 */
export interface Route {
  id: string;
  name: string;
  idx: number;
  n: number;
  lat: number[];
  lon: number[];
  km: number[];
  refs: number[];
  gaps: number;
  members: Member[];
  /** Included members only. */
  active: Member[];
  /** Per block: mean, lowest, highest and number of included drivers. */
  avg: (number | null)[];
  min: (number | null)[];
  max: (number | null)[];
  nd: number[];
}

export interface Rating {
  id: string;
  good: number; // below this = Good
  fair: number; // above this = Poor
}

export type Condition = "Good" | "Fair" | "Poor";
export type ColorMode = "value" | "class";
export type Selection = "avg" | string; // "avg" or a dataset id

export interface ParseResult {
  datasets: Omit<Dataset, "id" | "fileId" | "fileName">[];
  warn: string[];
  error: string | null;
}
