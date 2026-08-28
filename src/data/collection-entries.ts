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
 * A few entries below are marked needsVerification: true. They were
 * transcribed from a scanned survey chart where a handful of chainage
 * figures were not fully legible; everything else on this page already
 * reflects the confirmed record. Once those figures are confirmed, clear
 * the flag (or correct the numbers) and remove PENDING_VERIFICATION_NOTE.
 *
 * HOW TO ADD A NEW DAY'S ENTRY
 * Append one object per lane/direction segment surveyed that day:
 *
 *   {
 *     id: "e12",
 *     seq: 12,                      // next reference number, "#12" on the page
 *     date: "2026-08-28",           // YYYY-MM-DD
 *     direction: "MP",              // "MP" (Mumbai to Pune) | "PM" (Pune to Mumbai)
 *     lane: "L1",                   // "L1" (Inner Lane, nearest median) | "L2" (Middle Lane) | "L3" (Outer Lane)
 *     chainageFrom: 31.4,           // km, start of the surveyed segment
 *     chainageTo: 38.0,             // km, end of the surveyed segment
 *     team: "Survey Team A",        // optional
 *     remarks: "Classified count",  // optional
 *   },
 *
 * Chainage is always expressed on the single 0 to 94.4 km reference line,
 * regardless of direction. On the record, lanes on the Mumbai to Pune
 * carriageway are addressed L1/L2/L3 and lanes on the Pune to Mumbai
 * carriageway as R1/R2/R3; both map to the same lane ids here (direction
 * plus lane id together identify the carriageway and position). Overlapping
 * or duplicate ranges are handled automatically by
 * src/lib/collection-utils.ts (merged, not double counted), so logging a
 * re-survey of an already covered stretch is safe.
 */
export const IS_SAMPLE_DATA = false;

export const PENDING_VERIFICATION_NOTE =
  "Entries #5, #8, #9, #10 and #11 were transcribed from a scanned survey chart and need to be confirmed against the original record before they are treated as final.";

export const collectionEntries: CollectionEntry[] = [
  {
    id: "e1",
    seq: 1,
    date: "2026-08-26",
    direction: "MP",
    lane: "L1",
    chainageFrom: 0,
    chainageTo: 34,
    remarks: "Classified volume count",
  },
  {
    id: "e2",
    seq: 2,
    date: "2026-08-26",
    direction: "PM",
    lane: "L1",
    chainageFrom: 0,
    chainageTo: 31,
    remarks: "Classified volume count",
  },
  {
    id: "e3",
    seq: 3,
    date: "2026-08-26",
    direction: "MP",
    lane: "L2",
    chainageFrom: 0,
    chainageTo: 30,
    remarks: "Classified volume count",
  },
  {
    id: "e4",
    seq: 4,
    date: "2026-08-26",
    direction: "MP",
    lane: "L1",
    chainageFrom: 62,
    chainageTo: 94.4,
    remarks: "Classified volume count",
  },
  {
    id: "e5",
    seq: 5,
    date: "2026-08-26",
    direction: "PM",
    lane: "L1",
    chainageFrom: 60,
    chainageTo: 94.4,
    remarks: "Classified volume count",
    needsVerification: true,
  },
  {
    id: "e6",
    seq: 6,
    date: "2026-08-27",
    direction: "MP",
    lane: "L3",
    chainageFrom: 0,
    chainageTo: 31,
    remarks: "Classified volume count",
  },
  {
    id: "e7",
    seq: 7,
    date: "2026-08-27",
    direction: "MP",
    lane: "L1",
    chainageFrom: 34,
    chainageTo: 62.4,
    remarks: "Classified volume count",
  },
  {
    id: "e8",
    seq: 8,
    date: "2026-08-27",
    direction: "MP",
    lane: "L1",
    chainageFrom: 62.4,
    chainageTo: 62.6,
    remarks: "Short connecting segment, exact chainage to be confirmed",
    needsVerification: true,
  },
  {
    id: "e9",
    seq: 9,
    date: "2026-08-27",
    direction: "MP",
    lane: "L2",
    chainageFrom: 85,
    chainageTo: 94.4,
    remarks: "Classified volume count",
    needsVerification: true,
  },
  {
    id: "e10",
    seq: 10,
    date: "2026-08-27",
    direction: "PM",
    lane: "L2",
    chainageFrom: 59,
    chainageTo: 82,
    remarks: "Classified volume count",
    needsVerification: true,
  },
  {
    id: "e11",
    seq: 11,
    date: "2026-08-27",
    direction: "PM",
    lane: "L2",
    chainageFrom: 34,
    chainageTo: 45,
    remarks: "Classified volume count",
    needsVerification: true,
  },
];
