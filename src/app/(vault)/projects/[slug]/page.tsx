import ProjectRecord from "@/components/vault/ProjectRecord";

export default async function ProjectPage({ params }: PageProps<"/projects/[slug]">) {
  const { slug } = await params;
  return <ProjectRecord slug={slug} />;
}
