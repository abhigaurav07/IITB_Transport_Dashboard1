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
 *     id: "e24",
 *     seq: 24,                      // next reference number, "#24" on the page
 *     date: "2026-08-31",           // YYYY-MM-DD
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
 * plus lane id together identify the carriageway and position).
 *
 * chainageFrom is NOT always the smaller number. The field log records
 * chainage in the direction actually driven that day, so a Pune to Mumbai
 * (PM) entry is often written decreasing, e.g. chainageFrom: 94.6,
 * chainageTo: 82. That is intentional and preserved here exactly as
 * logged, matching the physical notebook; it displays the same way on the
 * page. All the progress and coverage math in
 * src/lib/collection-utils.ts normalizes to the physical span internally,
 * so either direction is handled correctly, and overlapping or duplicate
 * ranges are merged rather than double counted.
 *
 * An entry can be marked needsVerification: true if its chainage still
 * needs to be confirmed against the original field record; this shows a
 * "Pending verification" tag on that row and a notice banner at the top
 * of the page. Two entries below are currently flagged this way, see
 * their remarks.
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
    chainageFrom: 82,
    chainageTo: 45,
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

  // 29 August 2026
  {
    id: "e13",
    seq: 13,
    date: "2026-08-29",
    direction: "MP",
    lane: "L2",
    chainageFrom: 42,
    chainageTo: 54,
  },
  {
    id: "e14",
    seq: 14,
    date: "2026-08-29",
    direction: "MP",
    lane: "L3",
    chainageFrom: 31,
    chainageTo: 46,
  },
  {
    id: "e15",
    seq: 15,
    date: "2026-08-29",
    direction: "PM",
    lane: "L2",
    chainageFrom: 32,
    chainageTo: 0,
  },
  {
    id: "e16",
    seq: 16,
    date: "2026-08-29",
    direction: "PM",
    lane: "L3",
    chainageFrom: 32,
    chainageTo: 0,
  },

  // 30 August 2026
  {
    id: "e17",
    seq: 17,
    date: "2026-08-30",
    direction: "MP",
    lane: "L2",
    chainageFrom: 30,
    chainageTo: 42,
  },
  {
    id: "e18",
    seq: 18,
    date: "2026-08-30",
    direction: "MP",
    lane: "L2",
    chainageFrom: 54,
    chainageTo: 87,
  },
  {
    id: "e19",
    seq: 19,
    date: "2026-08-30",
    direction: "MP",
    lane: "L3",
    chainageFrom: 46,
    chainageTo: 86,
  },
  {
    id: "e20",
    seq: 20,
    date: "2026-08-30",
    direction: "PM",
    lane: "L1",
    chainageFrom: 70,
    chainageTo: 31,
    remarks: "Chainage read as 70+000 from the field notebook; one digit was unclear on the original page.",
    needsVerification: true,
  },
  {
    id: "e21",
    seq: 21,
    date: "2026-08-30",
    direction: "PM",
    lane: "L2",
    chainageFrom: 94.6,
    chainageTo: 82,
    remarks: "Field notebook dates this 30 August; an earlier note from the team gave 28 August for the same segment.",
    needsVerification: true,
  },
  {
    id: "e22",
    seq: 22,
    date: "2026-08-30",
    direction: "PM",
    lane: "L2",
    chainageFrom: 45,
    chainageTo: 32,
  },
  {
    id: "e23",
    seq: 23,
    date: "2026-08-30",
    direction: "PM",
    lane: "L3",
    chainageFrom: 94.6,
    chainageTo: 32,
  },
];
