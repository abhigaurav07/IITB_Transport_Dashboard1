import type { Metadata } from "next";
import UnderConstruction from "@/components/ui/UnderConstruction";

export const metadata: Metadata = { title: "Data Analysis" };

export default function DataAnalysisPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Data Analysis Module</p>
        <h1 className="mt-1 text-2xl font-semibold text-ink lg:text-3xl">Data Analysis</h1>
      </div>
      <UnderConstruction
        title="Data Analysis module"
        description="Volume, speed, density, V/C ratio and capacity analysis will live here."
      />
    </div>
  );
}
