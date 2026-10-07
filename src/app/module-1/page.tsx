import type { Metadata } from "next";
import IriModule from "@/components/iri/IriModule";

export const metadata: Metadata = { title: "Road Roughness (IRI)" };

export default function Module1Page() {
  return <IriModule />;
}
