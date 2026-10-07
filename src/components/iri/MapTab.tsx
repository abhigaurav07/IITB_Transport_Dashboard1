"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Card, FieldLabel, Segmented } from "./ui";
import { BlockPanel } from "./BlockReadout";
import type { View } from "./view";
import type { Basemap } from "./MapView";
import { ColorLegend } from "./Legend";

const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => <div className="grid h-full place-items-center text-sm text-ink-muted">Loading map</div>,
});

export default function MapTab({ v }: { v: View }) {
  const [basemap, setBasemap] = useState<Basemap>("light");
  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
      <Card
        title={v.selection === "avg" ? "Map of the average IRI of each 50 m block" : `${v.selectedLabel} · map of each 50 m block`}
        subtitle="Hover or tap the route to read a block. The base map is kept faint so the IRI colours stand out. Other loaded routes appear in grey."
        action={
          <div className="flex items-center gap-2">
            <FieldLabel>Base map</FieldLabel>
            <Segmented<Basemap>
              label="Base map"
              value={basemap}
              onChange={setBasemap}
              options={[
                { id: "light", label: "Light" },
                { id: "streets", label: "Streets" },
                { id: "osm", label: "OSM" },
                { id: "none", label: "None" },
              ]}
            />
          </div>
        }
      >
        <div className="h-[34rem] overflow-hidden rounded-lg border border-line bg-slate-100">
          <MapView v={v} basemap={basemap} />
        </div>
        <ColorLegend color={v.color} rating={v.rating} />
      </Card>
      <Card title="Selected block">
        <BlockPanel v={v} />
      </Card>
    </div>
  );
}
