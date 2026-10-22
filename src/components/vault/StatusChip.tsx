import type { ProjectStatus } from "@/lib/projects/types";

const TONE: Record<ProjectStatus, string> = {
  Planned: "bg-slate-100 text-slate-600",
  Ongoing: "bg-primary-50 text-primary",
  Completed: "bg-success-50 text-success",
};
const DOT: Record<ProjectStatus, string> = { Planned: "bg-slate-400", Ongoing: "bg-primary", Completed: "bg-success" };

export default function StatusChip({ status }: { status: ProjectStatus }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ${TONE[status]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${DOT[status]}`} />
      {status}
    </span>
  );
}
