import Link from "next/link";
import ProjectsExplorer from "@/components/vault/ProjectsExplorer";

export const metadata = { title: "Projects" };

export default function ProjectsPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-10 lg:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-ink">Projects</h1>
          <p className="mt-1.5 text-sm text-ink-muted">Open a project to see its records and results.</p>
        </div>
        <Link
          href="/projects/new"
          className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-white transition hover:bg-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Create new project
        </Link>
      </div>
      <div className="mt-8">
        <ProjectsExplorer />
      </div>
    </div>
  );
}
