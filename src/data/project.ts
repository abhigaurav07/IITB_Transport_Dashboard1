import type { Direction, DirectionId, Lane, LaneId } from "@/lib/types";

/**
 * Project level configuration. Update these values if the route,
 * chainage extent, or lane count ever changes.
 */
export const PROJECT = {
  name: "Mumbai-Pune Expressway (Yashwantrao Chavan Expressway)",
  /** Compact form for tight UI spots such as the sidebar footer. */
  shortName: "Mumbai-Pune Expressway",
  fullName:
    "Traffic and Transportation Data Collection Study for the Mumbai-Pune Expressway (Yashwantrao Chavan Expressway)",
  totalChainageKm: 94.6,
  startChainage: 0,
  laneConfiguration: "6 lane expressway (3 lanes per direction)",
  /** Shown as a bracketed tag next to the chainage extent on the tracker header. */
  chainageTag: "GHAT SECTION COVERAGE",
} as const;

export const DIRECTIONS: Direction[] = [
  { id: "MP", label: "Mumbai to Pune", shortLabel: "M to P" },
  { id: "PM", label: "Pune to Mumbai", shortLabel: "P to M" },
];

/**
 * Lane identity is independent of direction: every direction has its own
 * Inner, Middle and Outer lane. "Inner" is always the lane nearest the
 * median, "Outer" the lane nearest the road edge.
 *   L1 = Inner Lane    (nearest the median)
 *   L2 = Middle Lane
 *   L3 = Outer Lane    (nearest the road edge)
 */
export const LANES: Lane[] = [
  { id: "L1", label: "Inner Lane", position: "Inner" },
  { id: "L2", label: "Middle Lane", position: "Middle" },
  { id: "L3", label: "Outer Lane", position: "Outer" },
];

/**
 * The field naming convention used on the daily survey record: lanes on
 * the Mumbai to Pune carriageway are addressed as L1/L2/L3, lanes on the
 * Pune to Mumbai carriageway as R1/R2/R3 (L1 and R1 both sit nearest the
 * median). Use this wherever a lane needs to be identified the same way
 * the field team refers to it.
 */
export function laneCode(directionId: DirectionId, laneId: LaneId): string {
  const n = laneId.slice(1);
  return directionId === "MP" ? `L${n}` : `R${n}`;
}

/** "Inner Lane (L1)" or "Inner Lane (R1)": combines the descriptive name with the field code. */
export function laneCodeLabel(directionId: DirectionId, laneId: LaneId): string {
  const lane = LANES.find((l) => l.id === laneId);
  return `${lane?.label ?? laneId} (${laneCode(directionId, laneId)})`;
}
