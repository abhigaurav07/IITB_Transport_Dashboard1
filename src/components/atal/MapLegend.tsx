import { RAMP_CSS } from "@/lib/iri/scale";
import { MAP_HI, MAP_LO } from "@/lib/atal/nsv";

export default function MapLegend({ note }: { note?: string }) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-ink-muted">
      <span className="inline-flex items-center gap-2">
        <span>≤{MAP_LO.toFixed(1)}</span>
        <span className="h-2.5 w-28 rounded-full sm:w-44" style={{ background: RAMP_CSS }} aria-hidden />
        <span>≥{MAP_HI.toFixed(1)}</span>
        <span>IRI (m/km)</span>
      </span>
      <span className="inline-flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-sm border border-line" style={{ background: "var(--chart-grid)" }} aria-hidden />
        No value
      </span>
      {note ? <span>{note}</span> : null}
    </div>
  );
}
