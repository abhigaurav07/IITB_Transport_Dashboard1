import Link from "next/link";
import type { Project } from "@/lib/projects/types";
import { dateRange } from "@/lib/projects/format";
import StatusChip from "./StatusChip";
import ProjectArt from "./ProjectArt";
import Tag from "@/components/ui/Tag";
import { ChevronRightIcon } from "@/components/icons";

export default function ProjectCard({ p, datasets, index = 0 }: { p: Project; datasets?: { count: number; categories: number }; index?: number }) {
  const href = p.href ?? `/projects/${p.slug}`;
  return (
    <Link
      href={href}
      style={{ "--d": `${Math.min(index, 8) * 0.05}s` } as React.CSSProperties}
      className="tp-fade group flex h-full flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-card transition-[translate,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lift"
    >
      <div className="h-36 overflow-hidden border-b border-line-soft">
        {p.cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.cover} alt="" className="h-full w-full object-cover" />
        ) : (
          <ProjectArt project={p} />
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between gap-3">
          <StatusChip status={p.status} />
          <span className="truncate text-xs text-ink-muted">{p.category}</span>
        </div>
        <h3 className="mt-3 text-lg font-semibold leading-snug tracking-tight text-ink">{p.title}</h3>
        <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-ink-muted">{p.summary}</p>
        {p.tags.length ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {p.tags.slice(0, 3).map((t) => (
              <Tag key={t}>{t}</Tag>
            ))}
            {p.tags.length > 3 ? <span className="px-1 py-0.5 text-xs text-ink-muted">+{p.tags.length - 3}</span> : null}
          </div>
        ) : null}
        {datasets && datasets.count > 0 ? (
          <p className="mt-3 text-xs text-ink-muted" data-testid="dataset-summary">
            <span className="font-medium text-ink">{datasets.count}</span> {datasets.count === 1 ? "dataset" : "datasets"} &middot; <span className="font-medium text-ink">{datasets.categories}</span> {datasets.categories === 1 ? "category" : "categories"}
          </p>
        ) : null}
        <div className="mt-auto flex items-end justify-between gap-3 border-t border-line-soft pt-4" style={{ marginTop: "1.25rem" }}>
          <div className="min-w-0 text-xs text-ink-muted">
            <p className="truncate font-medium text-ink">{p.owner || "No owner"}</p>
            <p className="truncate">{dateRange(p.startDate, p.endDate)}</p>
          </div>
          <span className="inline-flex shrink-0 items-center text-sm font-medium text-primary">
            View Project
            <ChevronRightIcon className="ml-0.5 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
