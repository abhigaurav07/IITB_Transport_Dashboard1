import type { Metadata } from "next";
import UnderConstruction from "@/components/ui/UnderConstruction";

export const metadata: Metadata = { title: "Module 1" };

export default function Module1Page() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Module 1</p>
        <h1 className="mt-1 text-2xl font-semibold text-ink lg:text-3xl">Module 1</h1>
      </div>
      <UnderConstruction
        title="Module 1"
        description="Content and scope for this module will be provided at a later stage."
      />
    </div>
  );
}
