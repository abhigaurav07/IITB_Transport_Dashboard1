"use client";

import { useProjects } from "@/lib/projects/store";

export default function VaultStats() {
  const projects = useProjects();
  const items = [
    { k: "Projects", v: projects.length },
    { k: "Ongoing", v: projects.filter((p) => p.status === "Ongoing").length },
    { k: "Completed", v: projects.filter((p) => p.status === "Completed").length },
  ];
  return (
    <dl className="flex gap-8">
      {items.map((i) => (
        <div key={i.k}>
          <dd className="text-2xl font-semibold tabular-nums text-ink">{i.v}</dd>
          <dt className="text-xs text-ink-muted">{i.k}</dt>
        </div>
      ))}
    </dl>
  );
}
