import Link from "next/link";
import { ChevronRightIcon } from "@/components/icons";
import { projectDef } from "@/lib/projects/modules";

export default function ProjectHub({ slug }: { slug: string }) {
  const def = projectDef(slug)!;
  return (
    <div className="space-y-8">
      <div>
        <Link href="/projects" className="text-xs font-medium text-ink-muted hover:text-primary">
          &larr; All projects
        </Link>
        <h1 className="mt-3 text-2xl font-semibold text-ink lg:text-3xl">{def.name}</h1>
        <p className="mt-2 text-sm text-ink-muted">{def.modules.length === 1 ? "Module" : "Modules"}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {def.modules.map((m) => (
          <Link
            key={m.path}
            href={`/projects/${slug}/${m.path}`}
            className="group flex flex-col justify-between rounded-xl border border-line bg-surface p-5 transition hover:border-primary/40 hover:shadow-sm"
          >
            <div>
              <div className="flex items-center gap-2.5">
                {m.number ? (
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary-50 text-xs font-semibold text-primary">{m.number}</span>
                ) : null}
                <h2 className="text-sm font-semibold text-ink">{m.label}</h2>
              </div>
              <p className="mt-2 text-xs text-ink-muted">{m.description}</p>
            </div>
            <span className="mt-4 inline-flex items-center text-xs font-medium text-primary">
              Open module
              <ChevronRightIcon className="ml-0.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
