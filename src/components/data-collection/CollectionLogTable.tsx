"use client";

import { useMemo, useState } from "react";
import type { CollectionEntry, DirectionId, LaneId } from "@/lib/types";
import { DIRECTIONS, LANES, laneCodeLabel } from "@/data/project";
import { formatChainage, formatDate } from "@/lib/collection-utils";

type SortKey = "seq" | "date" | "chainageFrom" | "length";
type SortDir = "asc" | "desc";

const selectClasses =
  "rounded-md border border-line bg-surface px-2.5 py-1.5 text-xs font-medium text-ink focus:outline-none focus:ring-2 focus:ring-primary/30";

export default function CollectionLogTable({ entries }: { entries: CollectionEntry[] }) {
  const [direction, setDirection] = useState<DirectionId | "all">("all");
  const [lane, setLane] = useState<LaneId | "all">("all");
  const [sortKey, setSortKey] = useState<SortKey>("seq");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const filtered = useMemo(() => {
    let rows = entries;
    if (direction !== "all") rows = rows.filter((e) => e.direction === direction);
    if (lane !== "all") rows = rows.filter((e) => e.lane === lane);

    return [...rows].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "seq") cmp = a.seq - b.seq;
      else if (sortKey === "date") cmp = a.date.localeCompare(b.date);
      else if (sortKey === "chainageFrom") cmp = a.chainageFrom - b.chainageFrom;
      else cmp = a.chainageTo - a.chainageFrom - (b.chainageTo - b.chainageFrom);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [entries, direction, lane, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const directionLabel = (id: DirectionId) => DIRECTIONS.find((d) => d.id === id)?.label ?? id;
  const filtersActive = direction !== "all" || lane !== "all";

  return (
    <div className="rounded-xl border border-line bg-surface">
      <div className="flex flex-wrap items-center gap-2.5 border-b border-line px-4 py-3 lg:px-5">
        <h3 className="mr-auto text-base font-semibold text-ink">Daily Collection Log</h3>

        <label className="sr-only" htmlFor="filter-direction">
          Filter by direction
        </label>
        <select
          id="filter-direction"
          value={direction}
          onChange={(e) => setDirection(e.target.value as DirectionId | "all")}
          className={selectClasses}
        >
          <option value="all">All directions</option>
          {DIRECTIONS.map((d) => (
            <option key={d.id} value={d.id}>
              {d.label}
            </option>
          ))}
        </select>

        <label className="sr-only" htmlFor="filter-lane">
          Filter by lane
        </label>
        <select
          id="filter-lane"
          value={lane}
          onChange={(e) => setLane(e.target.value as LaneId | "all")}
          className={selectClasses}
        >
          <option value="all">All lanes</option>
          {LANES.map((l) => (
            <option key={l.id} value={l.id}>
              {l.label}
            </option>
          ))}
        </select>

        {filtersActive ? (
          <button
            type="button"
            onClick={() => {
              setDirection("all");
              setLane("all");
            }}
            className="text-xs font-medium text-primary hover:underline"
          >
            Clear filters
          </button>
        ) : null}
      </div>

      {filtered.length === 0 ? (
        <div className="px-5 py-14 text-center">
          <p className="text-sm font-medium text-ink">No entries match these filters</p>
          <p className="mt-1 text-xs text-ink-muted">
            {entries.length === 0
              ? "No collection data has been logged yet."
              : "Try clearing the direction / lane filters above."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto [scrollbar-width:thin]">
          <p className="px-4 pb-1.5 pt-2 text-[11px] text-ink-muted lg:hidden">
            Swipe left to see chainage, length and remarks →
          </p>
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-line bg-canvas/60 text-left text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
                <SortableTh label="#" active={sortKey === "seq"} dir={sortDir} onClick={() => toggleSort("seq")} />
                <SortableTh label="Date" active={sortKey === "date"} dir={sortDir} onClick={() => toggleSort("date")} />
                <th className="px-4 py-2.5">Direction</th>
                <th className="px-4 py-2.5">Lane</th>
                <SortableTh
                  label="Chainage"
                  active={sortKey === "chainageFrom"}
                  dir={sortDir}
                  onClick={() => toggleSort("chainageFrom")}
                />
                <SortableTh
                  label="Length"
                  active={sortKey === "length"}
                  dir={sortDir}
                  onClick={() => toggleSort("length")}
                />
                <th className="px-4 py-2.5">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.id} className="border-b border-line last:border-0 hover:bg-canvas/40">
                  <td className="whitespace-nowrap px-4 py-2.5 tabular-nums font-medium text-ink-muted">
                    #{e.seq}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 tabular-nums text-ink">{formatDate(e.date)}</td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-ink-muted">{directionLabel(e.direction)}</td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-ink-muted">
                    {laneCodeLabel(e.direction, e.lane)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 tabular-nums text-ink-muted">
                    Chainage {formatChainage(e.chainageFrom)} to {formatChainage(e.chainageTo)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 tabular-nums font-medium text-ink">
                    {(e.chainageTo - e.chainageFrom).toFixed(1)} km
                  </td>
                  <td className="px-4 py-2.5 text-ink-muted">
                    {e.remarks ? e.remarks : <span className="italic text-ink-muted/60">No remarks</span>}
                    {e.needsVerification ? (
                      <span className="ml-2 inline-flex items-center rounded-full bg-warning-50 px-2 py-0.5 text-[10px] font-medium text-warning">
                        Pending verification
                      </span>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="border-t border-line px-4 py-2.5 text-xs text-ink-muted lg:px-5">
        Showing {filtered.length} of {entries.length} logged entries
      </div>
    </div>
  );
}

function SortableTh({
  label,
  active,
  dir,
  onClick,
}: {
  label: string;
  active: boolean;
  dir: SortDir;
  onClick: () => void;
}) {
  return (
    <th className="px-4 py-2.5">
      <button type="button" onClick={onClick} className="inline-flex items-center gap-1 hover:text-ink">
        {label}
        <span className={active ? "text-primary" : "text-ink-muted/40"}>
          {active ? (dir === "asc" ? "▲" : "▼") : "▲▼"}
        </span>
      </button>
    </th>
  );
}
