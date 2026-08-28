import type { CollectionEntry } from "@/lib/types";

/**
 * ============================================================================
 * DAILY COLLECTION LOG: the single source of truth for the tracker page.
 * ============================================================================
 *
 * This file holds the actual field survey record, read directly into the
 * page. There is no database, so updating this array and redeploying is
 * the entire workflow.
 *
 * HOW TO ADD A NEW DAY'S ENTRY
 * Append one object per lane/direction segment surveyed that day. Chainage
 * is written in plain km here (the page renders it in the standard
 * engineering notation, e.g. 12.2 becomes "12+200" on screen):
 *
 *   {
 *     id: "e10",
 *     seq: 10,                      // next reference number, "#10" on the page
 *     date: "2026-08-28",           // YYYY-MM-DD
 *     direction: "MP",              // "MP" (Mumbai to Pune) | "PM" (Pune to Mumbai)
 *     lane: "L1",                   // "L1" (Inner Lane, nearest median) | "L2" (Middle Lane) | "L3" (Outer Lane)
 *     chainageFrom: 31.2,           // km, start of the surveyed segment
 *     chainageTo: 38.0,             // km, end of the surveyed segment
 *     remarks: "",                  // optional, leave out or blank if there is nothing to note
 *   },
 *
 * Chainage is always expressed on the single 0 to 94.6 km reference line,
 * regardless of direction. On the record, lanes on the Mumbai to Pune
 * carriageway are addressed L1/L2/L3 and lanes on the Pune to Mumbai
 * carriageway as R1/R2/R3; both map to the same lane ids here (direction
 * plus lane id together identify the carriageway and position). Overlapping
 * or duplicate ranges are handled automatically by
 * src/lib/collection-utils.ts (merged, not double counted), so logging a
 * re-survey of an already covered stretch is safe.
 *
 * An entry can be marked needsVerification: true if its chainage still
 * needs to be confirmed against the original field record; this shows a
 * "Pending verification" tag on that row and a notice banner at the top
 * of the page. None of the entries below currently need it.
 */
export const IS_SAMPLE_DATA = false;

export const PENDING_VERIFICATION_NOTE =
  "Some entries below are pending verification against the original field record. Check the tagged rows in the Daily Collection Log.";

export const collectionEntries: CollectionEntry[] = [
  // 26 August 2026
  {
    id: "e1",
    seq: 1,
    date: "2026-08-26",
    direction: "MP",
    lane: "L1",
    chainageFrom: 0,
    chainageTo: 34,
  },
  {
    id: "e2",
    seq: 2,
    date: "2026-08-26",
    direction: "MP",
    lane: "L1",
    chainageFrom: 62.4,
    chainageTo: 72,
  },
  {
    id: "e3",
    seq: 3,
    date: "2026-08-26",
    direction: "MP",
    lane: "L1",
    chainageFrom: 85,
    chainageTo: 94.6,
  },
  {
    id: "e4",
    seq: 4,
    date: "2026-08-26",
    direction: "MP",
    lane: "L2",
    chainageFrom: 0,
    chainageTo: 30,
  },
  {
    id: "e5",
    seq: 5,
    date: "2026-08-26",
    direction: "PM",
    lane: "L1",
    chainageFrom: 0,
    chainageTo: 31,
  },
  {
    id: "e6",
    seq: 6,
    date: "2026-08-26",
    direction: "PM",
    lane: "L1",
    chainageFrom: 72,
    chainageTo: 94.6,
  },

  // 27 August 2026
  {
    id: "e7",
    seq: 7,
    date: "2026-08-27",
    direction: "MP",
    lane: "L2",
    chainageFrom: 87,
    chainageTo: 94.6,
  },
  {
    id: "e8",
    seq: 8,
    date: "2026-08-27",
    direction: "MP",
    lane: "L3",
    chainageFrom: 0,
    chainageTo: 31,
  },
  {
    id: "e9",
    seq: 9,
    date: "2026-08-27",
    direction: "PM",
    lane: "L2",
    chainageFrom: 45,
    chainageTo: 82,
  },

  // 28 August 2026
  {
    id: "e10",
    seq: 10,
    date: "2026-08-28",
    direction: "MP",
    lane: "L1",
    chainageFrom: 34,
    chainageTo: 62.4,
  },
  {
    id: "e11",
    seq: 11,
    date: "2026-08-28",
    direction: "MP",
    lane: "L1",
    chainageFrom: 72,
    chainageTo: 85,
  },
  {
    id: "e12",
    seq: 12,
    date: "2026-08-28",
    direction: "MP",
    lane: "L3",
    chainageFrom: 86,
    chainageTo: 94.6,
  },
  {
    id: "e13",
    seq: 13,
    date: "2026-08-28",
    direction: "PM",
    lane: "L2",
    chainageFrom: 82,
    chainageTo: 94.6,
  },
];
