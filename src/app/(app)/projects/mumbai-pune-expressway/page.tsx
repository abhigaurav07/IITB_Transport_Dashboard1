import type { Metadata } from "next";
import ProjectHub from "@/components/layout/ProjectHub";

export const metadata: Metadata = { title: "Mumbai–Pune Expressway" };

export default function Page() {
  return <ProjectHub slug="mumbai-pune-expressway" />;
}
