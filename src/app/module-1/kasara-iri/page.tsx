import type { Metadata } from "next";
import IriModule from "@/components/iri/IriModule";

export const metadata: Metadata = { title: "KASARA IRI" };

export default function KasaraIriPage() {
  return <IriModule />;
}
