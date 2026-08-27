import Link from "next/link";
import { PROJECT } from "@/data/project";
import { MODULES } from "@/components/layout/nav-items";
import { ChevronRightIcon } from "@/components/icons";

export default function OverviewPage() {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Project Dashboard</p>
        <h1 className="mt-1 text-2xl font-semibold text-ink lg:text-3xl">{PROJECT.name}</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-muted">
          Traffic and transportation data collection, analysis and reporting workspace for the{" "}
          {PROJECT.totalChainageKm} km, {PROJECT.laneConfiguration} Mumbai–Pune Expressway study. Select a
          module below to continue.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MODULES.map((m) => (
          <ModuleCard key={m.href} {...m} />
        ))}
      </div>
    </div>
  );
}

function ModuleCard({
  href,
  label,
  description,
  status,
}: (typeof MODULES)[number]) {
  return (
    <Link
      href={href}
      className="group flex flex-col justify-between rounded-xl border border-line bg-surface p-5 transition hover:border-primary/40 hover:shadow-sm"
    >
      <div>
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-ink">{label}</h3>
          {status === "live" ? (
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-success-50 px-2 py-0.5 text-[10px] font-medium text-success">
              <span className="h-1.5 w-1.5 rounded-full bg-success" /> Live
            </span>
          ) : (
            <span className="inline-flex shrink-0 items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
              Under Construction
            </span>
          )}
        </div>
        <p className="mt-2 text-xs text-ink-muted">{description}</p>
      </div>
      <span className="mt-4 inline-flex items-center text-xs font-medium text-primary">
        {status === "live" ? "Open module" : "Preview"}
        <ChevronRightIcon className="ml-0.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}
