/** Small CSV helpers for the ATAL SETU files (comma or semicolon separated, header row first). */
export interface Table {
  head: string[]; // lower-case
  rows: string[][];
}

export function readTable(text: string): Table {
  const lines = text.replace(/^﻿/, "").split(/\r?\n/).filter((l) => l.trim() !== "");
  if (lines.length < 2) throw new Error("The file has no data rows.");
  const delim = lines[0].includes(",") ? "," : lines[0].includes(";") ? ";" : ",";
  const split = (l: string) => l.split(delim).map((s) => s.trim().replace(/^"|"$/g, ""));
  return { head: split(lines[0]).map((h) => h.toLowerCase()), rows: lines.slice(1).map(split) };
}

/** Index of the first header matching `re` (and not matching `not`), or -1. */
export function findCol(head: string[], re: RegExp, not?: RegExp): number {
  return head.findIndex((h) => re.test(h) && !(not && not.test(h)));
}

export function need(cols: Record<string, number>, what: string): void {
  const missing = Object.entries(cols).filter(([, v]) => v < 0).map(([k]) => k);
  if (missing.length) throw new Error(`${what}: could not find the column${missing.length > 1 ? "s" : ""} ${missing.join(", ")}.`);
}

export const num = (s: string | undefined): number => (s == null || s === "" ? NaN : Number(s));

export function haversineM(a1: number, o1: number, a2: number, o2: number): number {
  const R = 6371000;
  const rad = Math.PI / 180;
  const dA = (a2 - a1) * rad;
  const dO = (o2 - o1) * rad;
  const h = Math.sin(dA / 2) ** 2 + Math.cos(a1 * rad) * Math.cos(a2 * rad) * Math.sin(dO / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
