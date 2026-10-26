import type { ColorCtx } from "@/lib/iri/scale";
import { CLASS_COLOR, RAMP_CSS } from "@/lib/iri/scale";
import type { Condition, Rating } from "@/lib/iri/types";

export function ColorLegend({ color, rating }: { color: ColorCtx; rating: Rating }) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-ink-muted">
      {color.mode === "class" ? (
        (["Good", "Fair", "Poor"] as Condition[]).map((c) => (
          <span key={c} className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: CLASS_COLOR[c] }} aria-hidden />
            {c}{" "}
            {c === "Good" ? `(below ${rating.good.toFixed(2)})` : c === "Fair" ? `(${rating.good.toFixed(2)} to ${rating.fair.toFixed(2)})` : `(above ${rating.fair.toFixed(2)})`}
          </span>
        ))
      ) : (
        <span className="inline-flex items-center gap-2">
          <span>≤{color.lo.toFixed(1)}</span>
          <span className="h-2.5 w-28 rounded-full sm:w-44" style={{ background: RAMP_CSS }} aria-hidden />
          <span>≥{color.hi.toFixed(1)}</span>
          <span>predicted IRI</span>
        </span>
      )}
      <span className="inline-flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-sm border border-line" style={{ background: "var(--chart-grid)" }} aria-hidden />
        Not driven
      </span>
    </div>
  );
}
