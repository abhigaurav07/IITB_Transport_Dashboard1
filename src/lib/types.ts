// Core domain types for the Data Collection module.
// Keep this file framework-agnostic — no React/Next imports here.

export type DirectionId = "MP" | "PM";
export type LaneId = "L1" | "L2" | "L3";

/**
 * A lane's position relative to the median, independent of direction.
 * "Inner" is always the lane adjacent to the median (fastest/overtaking
 * lane), "Outer" is always the lane adjacent to the road edge.
 */
export type LanePosition = "Inner" | "Middle" | "Outer";

export interface Direction {
  id: DirectionId;
  /** Full label, e.g. "Mumbai → Pune" */
  label: string;
  /** Compact label for tight UI, e.g. "M → P" */
  shortLabel: string;
}

export interface Lane {
  id: LaneId;
  /** Display label, e.g. "Outer Lane" */
  label: string;
  position: LanePosition;
}

/**
 * One logged chainage segment surveyed on a given date, for a given
 * direction + lane. Chainage is always expressed on the single
 * 0 → totalChainageKm reference line (see src/data/project.ts),
 * regardless of which direction the entry belongs to.
 */
export interface CollectionEntry {
  id: string;
  /** ISO date, "YYYY-MM-DD" */
  date: string;
  direction: DirectionId;
  lane: LaneId;
  /** Start chainage in km, 0 <= chainageFrom < chainageTo */
  chainageFrom: number;
  /** End chainage in km */
  chainageTo: number;
  /** Optional survey crew / team identifier */
  team?: string;
  /** Optional free-text note (equipment used, conditions, etc.) */
  remarks?: string;
}
