import type { CollectionEntry } from "@/lib/types";

/**
 * ============================================================================
 * DAILY COLLECTION LOG — the single source of truth for the tracker page.
 * ============================================================================
 *
 * ⚠ SAMPLE DATA NOTICE
 * The entries below are placeholders, added only so this page can be
 * reviewed with realistic content (populated KPI cards, partially filled
 * progress bars, a non-empty log table). Set IS_SAMPLE_DATA to false and
 * replace the array once real survey data starts coming in.
 *
 * HOW TO ADD A NEW DAY'S ENTRY
 * Append one object per lane/direction segment surveyed that day:
 *
 *   {
 *     id: "e10",                    // any unique string
 *     date: "2026-08-26",           // YYYY-MM-DD
 *     direction: "MP",              // "MP" (Mumbai→Pune) | "PM" (Pune→Mumbai)
 *     lane: "L1",                   // "L1" | "L2" | "L3"
 *     chainageFrom: 31.4,           // km, start of the surveyed segment
 *     chainageTo: 38.0,             // km, end of the surveyed segment
 *     team: "Survey Team A",        // optional
 *     remarks: "Classified count",  // optional
 *   },
 *
 * Chainage is always expressed on the single 0 → 94.4 km reference line,
 * regardless of direction. Overlapping or duplicate ranges are handled
 * automatically by src/lib/collection-utils.ts (they are merged, not
 * double-counted), so it is safe to log a re-survey of an already-covered
 * stretch without corrupting the progress totals.
 */
export const IS_SAMPLE_DATA = true;

export const collectionEntries: CollectionEntry[] = [
  {
    id: "e1",
    date: "2026-08-18",
    direction: "PM",
    lane: "L2",
    chainageFrom: 0,
    chainageTo: 47.2,
    team: "Survey Team B",
    remarks: "Classified volume count (ATC)",
  },
  {
    id: "e2",
    date: "2026-08-19",
    direction: "PM",
    lane: "L2",
    chainageFrom: 47.2,
    chainageTo: 94.4,
    team: "Survey Team B",
    remarks: "Classified volume count (ATC)",
  },
  {
    id: "e3",
    date: "2026-08-20",
    direction: "MP",
    lane: "L1",
    chainageFrom: 0,
    chainageTo: 12.5,
    team: "Survey Team A",
    remarks: "Manual classified count",
  },
  {
    id: "e4",
    date: "2026-08-20",
    direction: "MP",
    lane: "L2",
    chainageFrom: 0,
    chainageTo: 10.0,
    team: "Survey Team A",
    remarks: "Manual classified count",
  },
  {
    id: "e5",
    date: "2026-08-21",
    direction: "MP",
    lane: "L1",
    chainageFrom: 12.5,
    chainageTo: 25.0,
    team: "Survey Team A",
    remarks: "Manual classified count",
  },
  {
    id: "e6",
    date: "2026-08-21",
    direction: "PM",
    lane: "L1",
    chainageFrom: 60.0,
    chainageTo: 94.4,
    team: "Survey Team C",
    remarks: "Speed & delay study",
  },
  {
    id: "e7",
    date: "2026-08-22",
    direction: "MP",
    lane: "L2",
    chainageFrom: 10.0,
    chainageTo: 18.6,
    team: "Survey Team A",
    remarks: "Manual classified count",
  },
  {
    id: "e8",
    date: "2026-08-23",
    direction: "MP",
    lane: "L3",
    chainageFrom: 0,
    chainageTo: 6.2,
    team: "Survey Team A",
    remarks: "Weather: clear, good visibility",
  },
  {
    id: "e9",
    date: "2026-08-24",
    direction: "MP",
    lane: "L1",
    chainageFrom: 25.0,
    chainageTo: 31.4,
    team: "Survey Team A",
    remarks: "Manual classified count",
  },
  {
    id: "e10",
    date: "2026-08-24",
    direction: "PM",
    lane: "L1",
    chainageFrom: 40.0,
    chainageTo: 60.0,
    team: "Survey Team C",
    remarks: "Speed & delay study",
  },
];
