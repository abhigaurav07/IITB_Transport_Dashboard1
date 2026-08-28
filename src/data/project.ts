import type { Direction, Lane } from "@/lib/types";

/**
 * Project-level configuration. Update these values if the route,
 * chainage extent, or lane count ever changes.
 */
export const PROJECT = {
  name: "Mumbai–Pune Expressway",
  fullName: "Mumbai–Pune Expressway — Traffic & Transportation Data Collection",
  totalChainageKm: 94.4,
  startChainage: 0,
  laneConfiguration: "6-lane (3 lanes per direction)",
} as const;

export const DIRECTIONS: Direction[] = [
  { id: "MP", label: "Mumbai → Pune", shortLabel: "M → P" },
  { id: "PM", label: "Pune → Mumbai", shortLabel: "P → M" },
];

/**
 * Lane identity is independent of direction — every direction has its own
 * Outer / Middle / Inner lane. "Inner" is always the lane nearest the
 * median, "Outer" the lane nearest the road edge.
 *   L1 = Outer Lane   (nearest the edge)
 *   L2 = Middle Lane
 *   L3 = Inner Lane    (nearest the median)
 */
export const LANES: Lane[] = [
  { id: "L1", label: "Outer Lane", position: "Outer" },
  { id: "L2", label: "Middle Lane", position: "Middle" },
  { id: "L3", label: "Inner Lane", position: "Inner" },
];
