import type { Metadata } from "next";
import IriModule from "@/components/iri/IriModule";

export const metadata: Metadata = { title: "KASRA Route IRI" };

export default function KasraRouteIriPage() {
  return <IriModule />;
}
