import type { Metadata } from "next";
import UnderConstruction from "@/components/ui/UnderConstruction";

export const metadata: Metadata = { title: "Traffic Modeling" };

export default function TrafficModelingPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Traffic Modeling Module</p>
        <h1 className="mt-1 text-2xl font-semibold text-ink lg:text-3xl">Traffic Modeling</h1>
      </div>
      <UnderConstruction
        title="Traffic Modeling module"
        description="Simulation, calibration and forecasting models will live here."
      />
    </div>
  );
}
