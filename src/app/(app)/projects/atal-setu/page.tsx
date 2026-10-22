import type { Metadata } from "next";
import ProjectHub from "@/components/layout/ProjectHub";

export const metadata: Metadata = { title: "Atal Setu" };

export default function Page() {
  return <ProjectHub slug="atal-setu" />;
}
