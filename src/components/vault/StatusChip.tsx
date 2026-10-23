import type { ProjectStatus } from "@/lib/projects/types";

const TONE: Record<ProjectStatus, string> = {
  Planned: "border-line bg-canvas text-ink-muted",
  Ongoing: "border-primary/20 bg-primary-50 text-primary-dark",
  Completed: "border-success/20 bg-success-50 text-success",
};
const DOT: Record<ProjectStatus, string> = { Planned: "bg-ink-muted/60", Ongoing: "bg-primary", Completed: "bg-success" };

export default function StatusChip({ status }: { status: ProjectStatus }) {
  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${TONE[status]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${DOT[status]}`} aria-hidden />
      {status}
    </span>
  );
}
