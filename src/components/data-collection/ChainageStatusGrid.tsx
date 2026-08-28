import type { Lane, LaneId, DirectionId } from "@/lib/types";
import {
  chainageCellBoundaries,
  computeChainageCells,
  formatChainage,
  type CellStatus,
  type ChainageCell,
  type ChainageCellBounds,
  type LaneDirectionProgress,
} from "@/lib/collection-utils";
import { LANES, PROJECT, laneCode } from "@/data/project";

// 1 box = 1 km of chainage. At 94.6 km this renders ~95 boxes per lane.
const CELL_SIZE_KM = 1;
const CELL_WIDTH_PX = 16;
const LABEL_WIDTH_PX = 196;

// Lanes are always listed Inner, Middle, Outer in project.ts. Mumbai to
// Pune's stack is reversed to Outer, Middle, Inner so its Inner lane sits
// nearest the median divider; Pune to Mumbai's stack keeps Inner, Middle,
// Outer so its Inner lane also sits nearest the median, mirroring the
// physical road cross-section (L1 and R1 both run alongside the median).
const MP_LANE_ORDER: LaneId[] = ["L3", "L2", "L1"];
const PM_LANE_ORDER: LaneId[] = ["L1", "L2", "L3"];

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
            Each box represents {CELL_SIZE_KM} km of chainage, from {formatChainage(0)} to {formatChainage(totalKm)}.
            Hover a box for detail.
          </p>
        </div>
        <Legend />
      </div>

      <p className="mb-1.5 text-[11px] text-ink-muted lg:hidden">Swipe left or right to see the full chainage →</p>

      <div className="overflow-x-auto rounded-lg border border-line [scrollbar-width:thin]">
        <div className="inline-grid" style={{ gridTemplateColumns }}>
          <EndpointLabelRow colCount={colCount} />
          <RulerRow boundaries={boundaries} edge="bottom" />

          {MP_LANE_ORDER.map((laneId) => (
            <LaneRow
              key={`MP-${laneId}`}
              directionId="MP"
              lane={laneById(laneId)}
              row={rowFor("MP", laneId)}
              cells={computeChainageCells(rowFor("MP", laneId).coveredIntervals, boundaries)}
            />
          ))}

          <MedianRow colCount={colCount} />

          {PM_LANE_ORDER.map((laneId) => (
            <LaneRow
              key={`PM-${laneId}`}
              directionId="PM"
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
        // Every 1 km gets its own label, rotated so a two digit number
        // still fits inside a 16px wide column without overlapping its
        // neighbours. Multiples of 10 are emphasized so the axis is still
        // easy to scan at a glance.
        const isMajor = i % 10 === 0;
        return (
          <div key={i} className={`relative h-8 ${borderClass} border-line`}>
            <span
              className={`absolute left-1/2 top-0.5 origin-top-left whitespace-nowrap text-[8px] leading-none tabular-nums ${
                isMajor ? "font-semibold text-ink" : "text-ink-muted"
              }`}
              style={{ transform: "rotate(90deg)" }}
            >
              {Math.round(b.from)}
            </span>
          </div>
        );
      })}
    </>
  );
}

function EndpointLabelRow({ colCount }: { colCount: number }) {
  return (
    <>
      <div className="sticky left-0 z-10 bg-surface" />
      <div
        style={{ gridColumn: `2 / span ${colCount}` }}
        className="flex items-center justify-between border-b border-line bg-canvas px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-ink-muted"
      >
        <span>Mumbai ({formatChainage(0)})</span>
        <span>Pune ({formatChainage(PROJECT.totalChainageKm)})</span>
      </div>
    </>
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

function LaneRow({
  directionId,
  lane,
  row,
  cells,
}: {
  directionId: DirectionId;
  lane: Lane;
  row: LaneDirectionProgress;
  cells: ChainageCell[];
}) {
  const label = `${lane.label} (${laneCode(directionId, lane.id)})`;
  return (
    <>
      <div className="sticky left-0 z-10 flex min-w-0 items-center justify-between gap-2 border-b border-line bg-surface px-3 py-1 text-xs">
        <span className="truncate font-medium text-ink">{label}</span>
        <span className="shrink-0 tabular-nums text-ink-muted">{row.percent.toFixed(0)}%</span>
      </div>
      {cells.map((cell, i) => (
        <div
          key={i}
          title={`${label} · Chainage ${formatChainage(cell.from)} to ${formatChainage(cell.to)} · ${STATUS_LABEL[cell.status]}${
            cell.status === "partial" ? ` (${cell.percent.toFixed(0)}%)` : ""
          }`}
          className={`h-5 border-b border-r border-white/50 ${STATUS_COLOR[cell.status]}`}
        />
      ))}
    </>
  );
}
