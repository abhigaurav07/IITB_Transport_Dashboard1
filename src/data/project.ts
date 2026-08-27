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

export const LANES: Lane[] = [
  { id: "L1", label: "Lane 1" },
  { id: "L2", label: "Lane 2" },
  { id: "L3", label: "Lane 3" },
];
