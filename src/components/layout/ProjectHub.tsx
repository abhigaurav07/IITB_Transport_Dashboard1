import ProjectWorkspace from "@/components/workspace/ProjectWorkspace";

/** Built-in projects open in the same workspace as new ones, inside the sidebar shell. */
export default function ProjectHub({ slug }: { slug: string }) {
  return <ProjectWorkspace slug={slug} />;
}
