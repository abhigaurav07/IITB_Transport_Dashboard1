import type { Metadata } from "next";
import UnderConstruction from "@/components/ui/UnderConstruction";

export const metadata: Metadata = { title: "ATAL SETU IRI" };

export default function AtalSetuIriPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Module 1 · Submodule 2</p>
        <h1 className="mt-1 text-2xl font-semibold text-ink lg:text-3xl">ATAL SETU IRI</h1>
      </div>
      <UnderConstruction title="ATAL SETU IRI" description="This submodule is under construction." />
    </div>
  );
}
