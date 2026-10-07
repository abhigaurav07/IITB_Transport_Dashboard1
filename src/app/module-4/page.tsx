import type { Metadata } from "next";
import UnderConstruction from "@/components/ui/UnderConstruction";

export const metadata: Metadata = { title: "Module 4" };

export default function Module4Page() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Module 4</p>
        <h1 className="mt-1 text-2xl font-semibold text-ink lg:text-3xl">Module 4</h1>
      </div>
      <UnderConstruction
        title="Module 4"
        description="Content and scope for this module will be provided at a later stage."
      />
    </div>
  );
}
