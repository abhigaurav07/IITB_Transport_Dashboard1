import type { Lane, LaneId, DirectionId } from "@/lib/types";
import {
  chainageCellBoundaries,
  computeChainageCells,
  type CellStatus,
  type ChainageCell,
  type ChainageCellBounds,
  type LaneDirectionProgress,
} from "@/lib/collection-utils";
import { DIRECTIONS, LANES, PROJECT } from "@/data/project";

// 1 box = 1 km of chainage. At 94.4 km this renders ~95 boxes per lane.
const CELL_SIZE_KM = 1;
const CELL_WIDTH_PX = 16;
const LABEL_WIDTH_PX = 176;

// Lanes are always listed Outer→Middle→Inner in project.ts. Mumbai→Pune's
// stack keeps that order so its Inner lane sits nearest the median divider;
// Pune→Mumbai's stack is reversed so *its* Inner lane also sits nearest the
// median — mirroring the physical road cross-section in the sketch.
const MP_LANE_ORDER: LaneId[] = ["L1", "L2", "L3"];
const PM_LANE_ORDER: LaneId[] = ["L3", "L2", "L1"];

const STATUS_COLOR: Record<CellStatus, string> = {
  covered: "bg-success",
  partial: "bg-warning",
  empty: "bg-danger/80",
};

const STATUS_LABEL: Record<CellStatus, string> = {
  covered: "Surveyed",
  partial: "Partially surveyed",
  empty: "Not surveyed",
};

function laneById(id: LaneId): Lane {
  return LANES.find((l) => l.id === id)!;
}

function directionLabel(id: DirectionId): string {
  return DIRECTIONS.find((d) => d.id === id)?.label ?? id;
}

export default function ChainageStatusGrid({ rows }: { rows: LaneDirectionProgress[] }) {
  const totalKm = PROJECT.totalChainageKm;
  const boundaries = chainageCellBoundaries(totalKm, CELL_SIZE_KM);
  const colCount = boundaries.length;
  const gridTemplateColumns = `${LABEL_WIDTH_PX}px repeat(${colCount}, ${CELL_WIDTH_PX}px)`;

  const rowFor = (directionId: DirectionId, laneId: LaneId) =>
    rows.find((r) => r.directionId === directionId && r.laneId === laneId)!;

  return (
    <div className="rounded-xl border border-line bg-surface p-4 lg:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-ink">Lane-wise Survey Status</h3>
          <p className="text-xs text-ink-muted">
            Each box = {CELL_SIZE_KM} km of chainage &middot; Chainage 0 – {totalKm} km &middot; hover a box for
            detail
          </p>
        </div>
        <Legend />
      </div>

      <p className="mb-1.5 text-[11px] text-ink-muted lg:hidden">Swipe left / right to see the full chainage →</p>

      <div className="overflow-x-auto rounded-lg border border-line [scrollbar-width:thin]">
        <div className="inline-grid" style={{ gridTemplateColumns }}>
          <RulerRow boundaries={boundaries} edge="bottom" />

          <DirectionHeaderRow label={directionLabel("MP")} colCount={colCount} />
          {MP_LANE_ORDER.map((laneId) => (
            <LaneRow
              key={`MP-${laneId}`}
              lane={laneById(laneId)}
              row={rowFor("MP", laneId)}
              cells={computeChainageCells(rowFor("MP", laneId).coveredIntervals, boundaries)}
            />
          ))}

          <MedianRow colCount={colCount} />

          <DirectionHeaderRow label={directionLabel("PM")} colCount={colCount} />
          {PM_LANE_ORDER.map((laneId) => (
            <LaneRow
              key={`PM-${laneId}`}
              lane={laneById(laneId)}
              row={rowFor("PM", laneId)}
              cells={computeChainageCells(rowFor("PM", laneId).coveredIntervals, boundaries)}
            />
          ))}

          <RulerRow boundaries={boundaries} edge="top" />
        </div>
      </div>
    </div>
  );
}

function Legend() {
  const items: Array<{ status: CellStatus; label: string }> = [
    { status: "covered", label: "Surveyed" },
    { status: "partial", label: "Partially surveyed" },
    { status: "empty", label: "Not surveyed" },
  ];
  return (
    <div className="flex flex-wrap items-center gap-3 text-[11px] text-ink-muted">
      {items.map((it) => (
        <span key={it.status} className="inline-flex items-center gap-1.5">
          <span className={`h-3 w-3 rounded-sm ${STATUS_COLOR[it.status]}`} aria-hidden />
          {it.label}
        </span>
      ))}
    </div>
  );
}

function RulerRow({
  boundaries,
  edge,
}: {
  boundaries: ChainageCellBounds[];
  edge: "top" | "bottom";
}) {
  const borderClass = edge === "bottom" ? "border-b" : "border-t";
  return (
    <>
      <div className={`sticky left-0 z-10 bg-surface ${borderClass} border-line`} />
      {boundaries.map((b, i) => {
        const showLabel = i % 10 === 0;
        return (
          <div key={i} className={`relative h-4 ${borderClass} border-line`}>
            {showLabel ? (
              <span className="absolute left-0 top-0 whitespace-nowrap text-[9px] leading-none tabular-nums text-ink-muted">
                {Math.round(b.from)}
              </span>
            ) : null}
          </div>
        );
      })}
    </>
  );
}

function DirectionHeaderRow({ label, colCount }: { label: string; colCount: number }) {
  return (
    <div
      style={{ gridColumn: `1 / span ${colCount + 1}` }}
      className="border-y border-line bg-canvas px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-ink-muted"
    >
      {label}
    </div>
  );
}

function MedianRow({ colCount }: { colCount: number }) {
  return (
    <div
      style={{ gridColumn: `1 / span ${colCount + 1}` }}
      className="flex items-center justify-center gap-2 bg-ink py-1 text-[10px] font-semibold uppercase tracking-widest text-white/70"
    >
      <span className="h-px w-6 bg-white/30" aria-hidden />
      Median
      <span className="h-px w-6 bg-white/30" aria-hidden />
    </div>
  );
}

function LaneRow({ lane, row, cells }: { lane: Lane; row: LaneDirectionProgress; cells: ChainageCell[] }) {
  return (
    <>
      <div className="sticky left-0 z-10 flex items-center justify-between gap-2 border-b border-line bg-surface px-3 py-1 text-xs">
        <span className="font-medium text-ink">{lane.label}</span>
        <span className="tabular-nums text-ink-muted">{row.percent.toFixed(0)}%</span>
      </div>
      {cells.map((cell, i) => (
        <div
          key={i}
          title={`${lane.label} · Ch. ${cell.from.toFixed(1)}–${cell.to.toFixed(1)} km · ${STATUS_LABEL[cell.status]}${
            cell.status === "partial" ? ` (${cell.percent.toFixed(0)}%)` : ""
          }`}
          className={`h-5 border-b border-r border-white/50 ${STATUS_COLOR[cell.status]}`}
        />
      ))}
    </>
  );
}
