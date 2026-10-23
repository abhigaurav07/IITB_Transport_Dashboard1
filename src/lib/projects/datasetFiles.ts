/** Rules for which raw files can be attached, and a light content check. Nothing is parsed or altered. */
export const MAX_FILE_BYTES = 100 * 1024 * 1024;

type Check = "pdf" | "zip" | "ole" | "sqlite" | "json" | "text" | "none";

const FORMATS: Record<string, { check: Check; hint?: string }> = {
  csv: { check: "text" },
  tsv: { check: "text" },
  txt: { check: "text" },
  xlsx: { check: "zip" },
  xls: { check: "ole" },
  pdf: { check: "pdf" },
  zip: { check: "zip" },
  geojson: { check: "json" },
  json: { check: "json" },
  gpkg: { check: "sqlite" },
  kml: { check: "text" },
  kmz: { check: "zip" },
};

export const ACCEPT = Object.keys(FORMATS)
  .map((e) => `.${e}`)
  .join(",");
export const FORMAT_LIST = Object.keys(FORMATS)
  .map((e) => e.toUpperCase())
  .join(", ");

export function extOf(name: string): string {
  const i = name.lastIndexOf(".");
  return i > 0 ? name.slice(i + 1).toLowerCase() : "";
}

export function stripExt(name: string): string {
  const i = name.lastIndexOf(".");
  return i > 0 ? name.slice(0, i) : name;
}

const startsWith = (b: Uint8Array, sig: number[]) => sig.every((v, i) => b[i] === v);

/** Returns an error message, or "" if the file looks acceptable. */
export async function inspectFile(file: File): Promise<string> {
  const ext = extOf(file.name);
  if (ext === "shp" || ext === "shx" || ext === "dbf" || ext === "prj")
    return "A shapefile must be uploaded as one ZIP containing the .shp, .shx and .dbf files (and .prj if available).";
  const rule = FORMATS[ext];
  if (!rule) return ext ? `.${ext} files are not supported. Accepted: ${FORMAT_LIST}.` : `This file has no extension. Accepted: ${FORMAT_LIST}.`;
  if (file.size === 0) return "The file is empty.";
  if (file.size > MAX_FILE_BYTES) return `The file is larger than the ${MAX_FILE_BYTES / 1024 / 1024} MB limit.`;
  let head: Uint8Array;
  try {
    head = new Uint8Array(await file.slice(0, 4096).arrayBuffer());
  } catch {
    return "The file could not be read. It may have been moved or deleted after it was selected.";
  }
  switch (rule.check) {
    case "pdf":
      return startsWith(head, [0x25, 0x50, 0x44, 0x46]) ? "" : "This does not look like a PDF file.";
    case "zip":
      return startsWith(head, [0x50, 0x4b]) ? "" : `This does not look like a valid .${ext} file (not a ZIP-based container).`;
    case "ole":
      return startsWith(head, [0xd0, 0xcf, 0x11, 0xe0]) ? "" : "This does not look like a valid .xls file.";
    case "sqlite":
      return new TextDecoder().decode(head.slice(0, 15)) === "SQLite format 3" ? "" : "This does not look like a valid GeoPackage file.";
    case "json": {
      const t = new TextDecoder().decode(head).replace(/^﻿/, "").trimStart();
      return t.startsWith("{") || t.startsWith("[") ? "" : `This does not look like a valid .${ext} file.`;
    }
    case "text":
      return head.includes(0) ? `This looks like a binary file, not a .${ext} text file.` : "";
    default:
      return "";
  }
}
