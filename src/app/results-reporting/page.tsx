import type { Metadata } from "next";
import UnderConstruction from "@/components/ui/UnderConstruction";

export const metadata: Metadata = { title: "Results & Reporting" };

export default function ResultsReportingPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Results &amp; Reporting Module</p>
        <h1 className="mt-1 text-2xl font-semibold text-ink lg:text-3xl">Results &amp; Reporting</h1>
      </div>
      <UnderConstruction
        title="Results & Reporting module"
        description="LOS assessment, final outputs and exportable reports will live here."
      />
    </div>
  );
}
