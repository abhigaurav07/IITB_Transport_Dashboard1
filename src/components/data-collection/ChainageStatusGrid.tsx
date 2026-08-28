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

// 1 box = 200 m of chainage, so every 1 km stretch of road is 5 boxes wide.
// This matches standard engineering chainage marking (0+000, 0+200, 0+400,
// ... 1+000, 1+200, ...) and gives each box's own left edge a precise,
// unambiguous chainage value. At 94.6 km this renders 473 boxes per lane.
const CELL_SIZE_KM = 0.2;
const CELL_WIDTH_PX = 10;
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
          <h3 className="text-base font-semibold text-ink">Lane-wise Survey Status</h3>
          <p className="text-sm text-ink-muted">
            Chainage surveyed per lane, per direction. Each box represents {Math.round(CELL_SIZE_KM * 1000)} m of
            chainage, marked from {formatChainage(0)} at Mumbai to {formatChainage(totalKm)} at Pune. Hover a box
            for detail.
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
  // The ruler's own edge (its border) sits flush against the lane grid; the
  // free space on the other side of that edge is where the tick and its
  // label live, growing away from the grid, like a scale drawn beside a
  // ruled box rather than text packed inside it.
  const borderClass = edge === "bottom" ? "border-b" : "border-t";
  const tickPos = edge === "bottom" ? "bottom-0" : "top-0";
  const labelPos = edge === "bottom" ? "bottom-2.5" : "top-2.5";
  // Both rulers anchor their tick and label at the edge nearest the grid,
  // then grow the label AWAY from the grid: the floor ruler (edge="top",
  // grid above it) rotates clockwise so text runs downward into its own
  // free space, while the ceiling ruler (edge="bottom", grid below it)
  // rotates counter-clockwise so text runs upward into its free space
  // instead of continuing down into the coloured boxes.
  const rotateDeg = edge === "bottom" ? -90 : 90;
  return (
    <>
      <div className={`sticky left-0 z-10 bg-surface ${borderClass} border-line`} />
      {boundaries.map((b, i) => {
        // Every box's left edge gets its own tick, extended out from the
        // grid line, with its exact chainage written beside it in the
        // standard km+m form, so a label is never ambiguous about which
        // boundary it belongs to. Whole-km ticks (0+000, 1+000, 2+000, ...)
        // are taller and darker, marking the primary scale; the 200 m ticks
        // in between are short, secondary marks.
        const isWholeKm = Math.abs(b.from - Math.round(b.from)) < 1e-6;
        return (
          <div key={i} className={`relative h-16 ${borderClass} border-line`}>
            <div
              className={`absolute left-0 w-px ${tickPos} ${
                isWholeKm ? "h-2.5 bg-ink" : "h-1.5 bg-ink-muted/60"
              }`}
            />
            <span
              className={`absolute left-0.5 ${labelPos} origin-top-left whitespace-nowrap text-[7px] leading-none tabular-nums ${
                isWholeKm ? "font-semibold text-ink" : "text-ink-muted"
              }`}
              style={{ transform: `rotate(${rotateDeg}deg)` }}
            >
              {formatChainage(b.from)}
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
