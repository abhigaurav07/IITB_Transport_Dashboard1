import type { ProgressStatus } from "@/lib/collection-utils";

const STYLES: Record<ProgressStatus, string> = {
  "not-started": "bg-slate-100 text-slate-600 border-slate-200",
  "in-progress": "bg-warning-50 text-warning border-warning/20",
  completed: "bg-success-50 text-success border-success/20",
};

const LABELS: Record<ProgressStatus, string> = {
  "not-started": "Not Started",
  "in-progress": "In Progress",
  completed: "Completed",
};

export default function StatusBadge({ status }: { status: ProgressStatus }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${STYLES[status]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      {LABELS[status]}
    </span>
  );
}
