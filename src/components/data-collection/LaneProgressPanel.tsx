import type { LaneDirectionProgress } from "@/lib/collection-utils";
import ChainageStatusGrid from "./ChainageStatusGrid";

export default function LaneProgressPanel({ rows }: { rows: LaneDirectionProgress[] }) {
  return <ChainageStatusGrid rows={rows} />;
}
