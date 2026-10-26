"use client";

import dynamic from "next/dynamic";
import { Card } from "./ui";
import { BlockPanel } from "./BlockReadout";
import type { View } from "./view";
import { ColorLegend } from "./Legend";

const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => <div className="grid h-full place-items-center text-sm text-ink-muted">Loading map</div>,
});

export default function MapTab({ v }: { v: View }) {
  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
      <Card title={v.selection === "avg" ? "Map of average IRI" : `${v.selectedLabel} · map`}>
        <div className="h-[34rem] overflow-hidden rounded-lg border border-line bg-surface-2">
          <MapView v={v} />
        </div>
        <ColorLegend color={v.color} rating={v.rating} />
      </Card>
      <Card title="Selected block">
        <BlockPanel v={v} />
      </Card>
    </div>
  );
}
