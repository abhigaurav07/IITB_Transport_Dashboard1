"use client";

import ProjectWorkspace from "@/components/workspace/ProjectWorkspace";

export default function ProjectRecord({ slug }: { slug: string }) {
  return <ProjectWorkspace slug={slug} crumbs />;
}
