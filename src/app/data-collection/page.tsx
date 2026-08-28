import type { Metadata } from "next";
import { collectionEntries, PENDING_VERIFICATION_NOTE } from "@/data/collection-entries";
import { PROJECT } from "@/data/project";
import {
  computeAllProgress,
  computeProjectSummary,
  formatDate,
  type ProjectSummary,
} from "@/lib/collection-utils";
import StatCard from "@/components/ui/StatCard";
import LaneProgressPanel from "@/components/data-collection/LaneProgressPanel";
import CollectionLogTable from "@/components/data-collection/CollectionLogTable";
import { WarningIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Data Collection: Daily Tracker",
};

export default function DataCollectionPage() {
  const rows = computeAllProgress(collectionEntries);
  const summary = computeProjectSummary(collectionEntries);
  const pendingVerification = collectionEntries.some((e) => e.needsVerification);

  return (
    <div className="space-y-6 lg:space-y-8">
      <PageHeader summary={summary} />

      {pendingVerification ? <PendingVerificationNotice /> : null}

      <section>
        <SectionTitle title="Progress Summary" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 lg:gap-4">
          <StatCard label="Overall Progress" value={`${summary.overallPercent.toFixed(1)}%`} tone="primary" />
          <StatCard
            label="Chainage Covered"
            value={`${summary.totalCoveredKm.toFixed(1)} km`}
            sublabel={`of ${summary.totalTargetKm.toFixed(1)} km total`}
          />
          <StatCard label="Chainage Remaining" value={`${summary.totalRemainingKm.toFixed(1)} km`} />
          <StatCard
            label="Segments Complete"
            value={`${summary.laneDirectionsCompleted} / ${summary.laneDirectionsTotal}`}
            sublabel="lane-directions"
          />
          <StatCard
            label="Days Active"
            value={`${summary.daysActive}`}
            sublabel={summary.avgKmPerDay > 0 ? `${summary.avgKmPerDay.toFixed(1)} km/day avg` : "No entries yet"}
          />
          <StatCard
            label="Est. Completion"
            value={summary.estRemainingDays !== null ? `~${summary.estRemainingDays} days` : "Not available"}
            sublabel="at current pace"
            tone="warning"
          />
        </div>
      </section>

      <section>
        <LaneProgressPanel rows={rows} />
      </section>

      <section>
        <CollectionLogTable entries={collectionEntries} />
      </section>
    </div>
  );
}

function PageHeader({ summary }: { summary: ProjectSummary }) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Data Collection Module</p>
        <h1 className="mt-1 text-2xl font-semibold text-ink lg:text-3xl">
          Daily Traffic Data Collection Tracker
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          {PROJECT.shortName} &middot; {PROJECT.laneConfiguration} &middot; Chainage 0 to {PROJECT.totalChainageKm}{" "}
          km [{PROJECT.chainageTag}]
        </p>
      </div>
      <div className="text-left lg:text-right">
        <p className="text-xs text-ink-muted">Last entry logged</p>
        <p className="text-sm font-medium text-ink">
          {summary.lastUpdated ? formatDate(summary.lastUpdated) : "No entries yet"}
        </p>
      </div>
    </div>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-3">
      <h2 className="text-sm font-semibold text-ink">{title}</h2>
      {subtitle ? <p className="text-xs text-ink-muted">{subtitle}</p> : null}
    </div>
  );
}

function PendingVerificationNotice() {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-warning/25 bg-warning-50 px-4 py-3 text-sm text-warning">
      <WarningIcon className="mt-0.5 h-4.5 w-4.5 shrink-0" />
      <div>
        <p className="font-medium">Some entries are pending verification</p>
        <p className="text-warning/80">{PENDING_VERIFICATION_NOTE}</p>
      </div>
    </div>
  );
}
