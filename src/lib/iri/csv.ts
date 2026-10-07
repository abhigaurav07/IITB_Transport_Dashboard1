import type { ParseResult, RawRow } from "./types";

/** Small RFC 4180 style parser: quoted fields, CRLF or LF, optional BOM. */
export function parseCSV(input: string): string[][] {
  const text = input.charCodeAt(0) === 0xfeff ? input.slice(1) : input;
  const rows: string[][] = [];
  let row: string[] = [];
  let f = "";
  let q = false;
  const n = text.length;
  for (let i = 0; i < n; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          f += '"';
          i++;
        } else q = false;
      } else f += c;
    } else if (c === '"') q = true;
    else if (c === ",") {
      row.push(f);
      f = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(f);
      f = "";
      if (row.length > 1 || row[0] !== "") rows.push(row);
      row = [];
    } else f += c;
  }
  if (f !== "" || row.length) {
    row.push(f);
    if (row.length > 1 || row[0] !== "") rows.push(row);
  }
  return rows;
}

function parseTimestamp(s: string | undefined): Date | null {
  if (!s) return null;
  let m = s.trim().replace(" ", "T").replace(/(\.\d{3})\d*/, "$1");
  if (!/[zZ]$|[+-]\d\d:?\d\d$/.test(m)) m += "Z";
  const d = new Date(m);
  return Number.isNaN(d.getTime()) ? null : d;
}

export const REQUIRED_COLUMNS = ["ref_idx", "driver_key", "lat", "lon", "predicted_iri"] as const;

/** Reads one CSV file into one dataset per driver_key. Never throws. */
export function parseDatasets(fileName: string, text: string): ParseResult {
  const out: ParseResult = { datasets: [], warn: [], error: null };
  const rows = parseCSV(text);
  if (rows.length < 2) {
    out.error = "the file has no data rows.";
    return out;
  }
  const head = rows[0].map((h) => h.trim().toLowerCase());
  const missing = REQUIRED_COLUMNS.filter((c) => !head.includes(c));
  if (missing.length) {
    out.error = `missing column${missing.length > 1 ? "s" : ""} ${missing.join(", ")}. Columns found: ${rows[0]
      .slice(0, 9)
      .map((h) => h.trim())
      .join(", ")}${head.length === 1 ? " (the file may not be comma separated)" : ""}.`;
    return out;
  }
  const ix: Record<string, number> = {};
  head.forEach((h, i) => {
    if (!(h in ix)) ix[h] = i;
  });
  const stem = fileName.replace(/\.[^.]*$/, "");
  const groups = new Map<string, Map<number, RawRow>>();
  let bad = 0;
  let dup = 0;
  let odd = 0;
  for (let r = 1; r < rows.length; r++) {
    const c = rows[r];
    const ref = Number(c[ix.ref_idx]);
    const lat = parseFloat(c[ix.lat]);
    const lon = parseFloat(c[ix.lon]);
    if (!Number.isInteger(ref) || ref < 0 || !Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
      bad++;
      continue;
    }
    const key = (c[ix.driver_key] ?? "").trim() || stem;
    const iv = parseFloat(c[ix.predicted_iri]);
    const iri = Number.isFinite(iv) ? iv : null;
    if (iri != null && (iri <= 0 || iri > 25)) odd++;
    const sp = ix.avg_speed_mps != null ? parseFloat(c[ix.avg_speed_mps]) : NaN;
    const t = ix.utc_timestamp != null ? parseTimestamp(c[ix.utc_timestamp]) : null;
    let g = groups.get(key);
    if (!g) {
      g = new Map();
      groups.set(key, g);
    }
    if (g.has(ref)) dup++;
    g.set(ref, { r: ref, lat, lon, iri, spd: Number.isFinite(sp) ? sp * 3.6 : null, t });
  }
  if (bad) out.warn.push(`${bad} row${bad === 1 ? "" : "s"} skipped (reference index, latitude or longitude not valid).`);
  if (dup) out.warn.push(`${dup} repeated reference index row${dup === 1 ? "" : "s"} found; the last one was used.`);
  if (odd) out.warn.push(`${odd} IRI value${odd === 1 ? "" : "s"} outside 0 to 25 were kept; please check the units.`);
  groups.forEach((g, key) => {
    const list = [...g.values()].sort((a, b) => a.r - b.r);
    const nv = list.filter((x) => x.iri != null).length;
    if (list.length < 2) {
      out.warn.push(`Driver ${key} has fewer than 2 usable rows and was skipped.`);
      return;
    }
    if (!nv) {
      out.warn.push(`Driver ${key} has no IRI values and was skipped.`);
      return;
    }
    const first = list.find((x) => x.t)?.t ?? null;
    out.datasets.push({ key, rows: list, nv, date: first });
  });
  if (!out.datasets.length && !out.error) {
    out.error = `no usable driver data was found${bad ? " (all rows had invalid reference or coordinate values)." : "."}`;
  }
  return out;
}

/** Cheap content fingerprint so the same file is not added twice. */
export function hashText(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return `${s.length}:${h}`;
}
