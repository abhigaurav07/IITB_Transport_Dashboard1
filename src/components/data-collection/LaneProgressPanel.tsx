import type { LaneDirectionProgress } from "@/lib/collection-utils";
import { DIRECTIONS, LANES, PROJECT } from "@/data/project";
import ChainageStrip from "./ChainageStrip";
import ChainageScale from "./ChainageScale";
import StatusBadge from "@/components/ui/StatusBadge";
import { formatDate } from "@/lib/collection-utils";

export default function LaneProgressPanel({ rows }: { rows: LaneDirectionProgress[] }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {DIRECTIONS.map((dir) => {
        const dirRows = rows.filter((r) => r.directionId === dir.id);
        return (
          <div key={dir.id} className="rounded-xl border border-line bg-surface p-4 lg:p-5">
            <div className="mb-4 flex items-baseline justify-between gap-2">
              <h3 className="text-sm font-semibold text-ink">{dir.label}</h3>
              <span className="shrink-0 text-xs text-ink-muted">
                Chainage 0 – {PROJECT.totalChainageKm} km
              </span>
            </div>

            <div className="space-y-5">
              {dirRows.map((r) => {
                const lane = LANES.find((l) => l.id === r.laneId)!;
                return (
                  <div key={r.laneId}>
                    <div className="mb-1.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                      <span className="text-sm font-medium text-ink">{lane.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs tabular-nums text-ink-muted">
                          {r.coveredKm.toFixed(1)} / {PROJECT.totalChainageKm} km &middot;{" "}
                          {r.percent.toFixed(1)}%
                        </span>
                        <StatusBadge status={r.status} />
                      </div>
                    </div>
                    <ChainageStrip totalKm={PROJECT.totalChainageKm} covered={r.coveredIntervals} />
                    <p className="mt-1 text-[11px] text-ink-muted">
                      {r.lastDate
                        ? `Last surveyed ${formatDate(r.lastDate)}`
                        : "No segments surveyed yet"}
                    </p>
                  </div>
                );
              })}
            </div>

            <ChainageScale totalKm={PROJECT.totalChainageKm} />
          </div>
        );
      })}
    </div>
  );
}
