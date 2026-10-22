import type { Metadata } from "next";
import ProjectHub from "@/components/layout/ProjectHub";

export const metadata: Metadata = { title: "Kasara" };

export default function Page() {
  return <ProjectHub slug="kasara" />;
}
