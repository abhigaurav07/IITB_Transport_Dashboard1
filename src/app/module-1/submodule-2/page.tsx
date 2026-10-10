import type { Metadata } from "next";
import UnderConstruction from "@/components/ui/UnderConstruction";

export const metadata: Metadata = { title: "Module 1 · Submodule 2" };

export default function Submodule2Page() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Module 1 · Submodule 2</p>
        <h1 className="mt-1 text-2xl font-semibold text-ink lg:text-3xl">Submodule 2</h1>
      </div>
      <UnderConstruction
        title="Submodule 2"
        description="Content and scope for this submodule will be provided at a later stage."
      />
    </div>
  );
}
