import type { Condition, Rating } from "./types";
import { conditionOf } from "./rating";

/**
 * Colour system for the IRI module.
 *  - Condition classes use the dashboard's status colours (green, amber, red) and are
 *    always paired with a text label, never colour alone.
 *  - IRI value uses one sequential orange ramp (light = smooth, dark = rough), kept
 *    apart from the blue used for interface chrome and the categorical driver colours.
 *  - Drivers use the IBM Carbon categorical order, chosen for contrast between neighbours.
 */
export const CLASS_COLOR: Record<Condition, string> = {
  Good: "#15803d",
  Fair: "#f59e0b",
  Poor: "#dc2626",
};
export const CLASS_TEXT: Record<Condition, string> = {
  Good: "#15803d",
  Fair: "#b45309",
  Poor: "#b91c1c",
};
export const DRIVER_COLORS = ["#6929c4", "#1192e8", "#005d5d", "#9f1853", "#002d9c", "#8a3800", "#003a6d", "#a56eff"];
export const NO_DATA = "#e2e8f0";

const RAMP_HEX = ["#fde5cc", "#fbc08a", "#f59a4d", "#e5702a", "#c4501a", "#9a3a12", "#6b2610"];
const RAMP: number[][] = RAMP_HEX.map((h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)));
export const RAMP_CSS = `linear-gradient(90deg, ${RAMP_HEX.join(",")})`;

export type RGB = [number, number, number];
export const mix = (a: number[], b: number[], t: number): RGB =>
  [0, 1, 2].map((k) => Math.round(a[k] + (b[k] - a[k]) * t)) as RGB;
export const rgbCss = (c: number[]) => `rgb(${c[0]},${c[1]},${c[2]})`;
const hexRgb = (h: string): RGB => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)) as RGB;

export function rampRgb(v: number, lo: number, hi: number): RGB {
  const t = Math.max(0, Math.min(1, (v - lo) / (hi - lo))) * (RAMP.length - 1);
  const i = Math.min(RAMP.length - 2, Math.floor(t));
  return mix(RAMP[i], RAMP[i + 1], t - i);
}

export interface ColorCtx {
  mode: "value" | "class";
  rating: Rating;
  lo: number;
  hi: number;
}
export function colorRgb(v: number | null | undefined, c: ColorCtx): RGB | null {
  if (v == null) return null;
  if (c.mode === "class") return hexRgb(CLASS_COLOR[conditionOf(v, c.rating)!]);
  return rampRgb(v, c.lo, c.hi);
}
export function colorCss(v: number | null | undefined, c: ColorCtx): string {
  const r = colorRgb(v, c);
  return r ? rgbCss(r) : NO_DATA;
}
