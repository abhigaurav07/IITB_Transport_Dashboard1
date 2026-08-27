import type { Metadata } from "next";
import UnderConstruction from "@/components/ui/UnderConstruction";

export const metadata: Metadata = { title: "Data Processing" };

export default function DataProcessingPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Data Processing Module</p>
        <h1 className="mt-1 text-2xl font-semibold text-ink lg:text-3xl">Data Processing</h1>
      </div>
      <UnderConstruction
        title="Data Processing module"
        description="Cleaning, validation and QA workflows for raw field data will live here."
      />
    </div>
  );
}
