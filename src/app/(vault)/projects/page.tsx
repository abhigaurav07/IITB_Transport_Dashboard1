import ProjectsExplorer from "@/components/vault/ProjectsExplorer";
import PageHeader from "@/components/ui/PageHeader";
import { LinkButton } from "@/components/ui/Button";

export const metadata = { title: "Projects" };

export default function ProjectsPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
      <PageHeader
        crumbs={[{ label: "Home", href: "/" }, { label: "Existing Projects" }]}
        title="Existing Projects"
        description="Select a project to open its modules, records and results."
        actions={<LinkButton href="/projects/new">Create a Project</LinkButton>}
      />
      <div className="mt-8">
        <ProjectsExplorer />
      </div>
    </div>
  );
}
