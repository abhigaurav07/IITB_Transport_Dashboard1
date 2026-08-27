import type { CollectionEntry, DirectionId, LaneId } from "@/lib/types";
import { PROJECT, DIRECTIONS, LANES } from "@/data/project";

export interface Interval {
  from: number;
  to: number;
}

/** Sorts and merges overlapping/adjacent intervals into disjoint ranges. */
export function mergeIntervals(intervals: Interval[]): Interval[] {
  if (intervals.length === 0) return [];
  const sorted = [...intervals].sort((a, b) => a.from - b.from);
  const merged: Interval[] = [{ ...sorted[0] }];
  for (let i = 1; i < sorted.length; i++) {
    const last = merged[merged.length - 1];
    const cur = sorted[i];
    if (cur.from <= last.to) {
      last.to = Math.max(last.to, cur.to);
    } else {
      merged.push({ ...cur });
    }
  }
  return merged;
}

/** Total length covered by a set of (possibly overlapping) intervals. */
export function coveredLength(intervals: Interval[]): number {
  return mergeIntervals(intervals).reduce((sum, iv) => sum + (iv.to - iv.from), 0);
}

/** The complement of `covered` within [0, totalKm] — the un-surveyed stretches. */
export function gapIntervals(covered: Interval[], totalKm: number): Interval[] {
  const merged = mergeIntervals(covered);
  const gaps: Interval[] = [];
  let cursor = 0;
  for (const iv of merged) {
    if (iv.from > cursor) gaps.push({ from: cursor, to: iv.from });
    cursor = Math.max(cursor, iv.to);
  }
  if (cursor < totalKm) gaps.push({ from: cursor, to: totalKm });
  return gaps;
}

export type ProgressStatus = "not-started" | "in-progress" | "completed";

export interface LaneDirectionProgress {
  directionId: DirectionId;
  laneId: LaneId;
  coveredKm: number;
  remainingKm: number;
  percent: number;
  coveredIntervals: Interval[];
  gapIntervals: Interval[];
  entryCount: number;
  lastDate: string | null;
  status: ProgressStatus;
}

export function getEntriesFor(
  entries: CollectionEntry[],
  directionId: DirectionId,
  laneId: LaneId
): CollectionEntry[] {
  return entries.filter((e) => e.direction === directionId && e.lane === laneId);
}

export function computeLaneDirectionProgress(
  entries: CollectionEntry[],
  directionId: DirectionId,
  laneId: LaneId,
  totalKm: number = PROJECT.totalChainageKm
): LaneDirectionProgress {
  const laneEntries = getEntriesFor(entries, directionId, laneId);
  const rawIntervals = laneEntries.map((e) => ({ from: e.chainageFrom, to: e.chainageTo }));
  const covered = mergeIntervals(rawIntervals);
  const coveredKm = coveredLength(rawIntervals);
  const remainingKm = Math.max(0, totalKm - coveredKm);
  const percent = totalKm > 0 ? (coveredKm / totalKm) * 100 : 0;
  const gaps = gapIntervals(covered, totalKm);
  const dates = laneEntries.map((e) => e.date).sort();
  const lastDate = dates.length ? dates[dates.length - 1] : null;

  let status: ProgressStatus = "not-started";
  if (percent >= 99.95) status = "completed";
  else if (percent > 0) status = "in-progress";

  return {
    directionId,
    laneId,
    coveredKm,
    remainingKm,
    percent,
    coveredIntervals: covered,
    gapIntervals: gaps,
    entryCount: laneEntries.length,
    lastDate,
    status,
  };
}

export function computeAllProgress(entries: CollectionEntry[]): LaneDirectionProgress[] {
  const rows: LaneDirectionProgress[] = [];
  for (const dir of DIRECTIONS) {
    for (const lane of LANES) {
      rows.push(computeLaneDirectionProgress(entries, dir.id, lane.id));
    }
  }
  return rows;
}

export interface ProjectSummary {
  totalTargetKm: number;
  totalCoveredKm: number;
  totalRemainingKm: number;
  overallPercent: number;
  daysActive: number;
  avgKmPerDay: number;
  lastUpdated: string | null;
  estRemainingDays: number | null;
  laneDirectionsCompleted: number;
  laneDirectionsTotal: number;
}

export function computeProjectSummary(entries: CollectionEntry[]): ProjectSummary {
  const totalTargetKm = PROJECT.totalChainageKm * DIRECTIONS.length * LANES.length;
  const rows = computeAllProgress(entries);
  const totalCoveredKm = rows.reduce((s, r) => s + r.coveredKm, 0);
  const totalRemainingKm = Math.max(0, totalTargetKm - totalCoveredKm);
  const overallPercent = totalTargetKm > 0 ? (totalCoveredKm / totalTargetKm) * 100 : 0;

  const uniqueDates = Array.from(new Set(entries.map((e) => e.date))).sort();
  const daysActive = uniqueDates.length;
  const avgKmPerDay = daysActive > 0 ? totalCoveredKm / daysActive : 0;
  const lastUpdated = uniqueDates.length ? uniqueDates[uniqueDates.length - 1] : null;
  const estRemainingDays = avgKmPerDay > 0 ? Math.ceil(totalRemainingKm / avgKmPerDay) : null;

  const laneDirectionsCompleted = rows.filter((r) => r.status === "completed").length;

  return {
    totalTargetKm,
    totalCoveredKm,
    totalRemainingKm,
    overallPercent,
    daysActive,
    avgKmPerDay,
    lastUpdated,
    estRemainingDays,
    laneDirectionsCompleted,
    laneDirectionsTotal: rows.length,
  };
}

export function formatKm(km: number, decimals = 1): string {
  return `${km.toFixed(decimals)} km`;
}

export function formatDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
