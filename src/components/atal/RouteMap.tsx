"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { NO_DATA } from "@/lib/iri/scale";

const OSM_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const OSM_ATTR = "© OpenStreetMap contributors";

export interface MapSeg {
  a: [number, number];
  b: [number, number];
}

// maps with the same syncKey pan and zoom together
const GROUPS = new Map<string, Set<L.Map>>();
let syncing = false;

/** Leaflet map on OpenStreetMap: every block drawn as a coloured line, with a marker on the selected block. */
export default function RouteMap({
  segs,
  colors,
  flags,
  cur,
  setCur,
  syncKey,
  startLabel,
  endLabel,
  ariaLabel,
}: {
  segs: MapSeg[];
  colors: (string | null)[];
  flags?: boolean[]; // blocks to ring in red
  cur: number;
  setCur: (i: number) => void;
  syncKey?: string;
  startLabel: string;
  endLabel: string;
  ariaLabel: string;
}) {
  const el = useRef<HTMLDivElement>(null);
  const marker = useRef<L.Polyline | null>(null);
  const polys = useRef<L.Polyline[]>([]);
  const segsRef = useRef<MapSeg[]>(segs);
  const live = useRef({ setCur });

  useEffect(() => {
    live.current = { setCur };
  });

  useEffect(() => {
    if (!el.current || !segs.length) return;
    segsRef.current = segs;
    const m = L.map(el.current, { preferCanvas: true });
    m.setView([18.97, 72.95], 11);
    L.control.scale({ imperial: false }).addTo(m);
    L.tileLayer(OSM_URL, { attribution: OSM_ATTR, opacity: 0.6, maxZoom: 19 }).addTo(m);
    const g = L.layerGroup().addTo(m);
    g.addLayer(L.polyline(segs.map((s) => s.a), { color: "#64748b", weight: 10, opacity: 0.22, interactive: false }));
    flags?.forEach((f, i) => {
      if (f) g.addLayer(L.polyline([segs[i].a, segs[i].b], { color: "#dc2626", weight: 14, opacity: 0.45, lineCap: "round", interactive: false }));
    });
    polys.current = segs.map((s) => {
      const pl = L.polyline([s.a, s.b], { weight: 6, lineCap: "round", opacity: 0.97, color: NO_DATA, interactive: false });
      g.addLayer(pl);
      return pl;
    });
    marker.current = L.polyline([segs[0].a, segs[0].b], { weight: 13, color: "#0f172a", opacity: 0.85, lineCap: "round", interactive: false }).addTo(m);
    const dot = (ll: L.LatLngTuple, tip: string) =>
      g.addLayer(L.circleMarker(ll, { radius: 7, color: "#ffffff", weight: 2, fillColor: "#0f172a", fillOpacity: 1 }).bindTooltip(tip));
    dot(segs[0].a, startLabel);
    dot(segs[segs.length - 1].b, endLabel);
    m.fitBounds(L.latLngBounds(segs.map((s) => s.a)), { padding: [24, 24] });

    const nearest = (e: L.LeafletMouseEvent, maxPx: number) => {
      const p = m.latLngToLayerPoint(e.latlng);
      let best = -1;
      let bd = maxPx * maxPx;
      for (let i = 0; i < segs.length; i++) {
        const a = m.latLngToLayerPoint(segs[i].a);
        const b = m.latLngToLayerPoint(segs[i].b);
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const l2 = dx * dx + dy * dy;
        const u = l2 ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2)) : 0;
        const qx = a.x + u * dx - p.x;
        const qy = a.y + u * dy - p.y;
        const d = qx * qx + qy * qy;
        if (d < bd) {
          bd = d;
          best = i;
        }
      }
      return best;
    };
    m.on("mousemove", (e: L.LeafletMouseEvent) => {
      const i = nearest(e, 26);
      if (i >= 0) live.current.setCur(i);
    });
    m.on("click", (e: L.LeafletMouseEvent) => {
      const i = nearest(e, 40);
      if (i >= 0) live.current.setCur(i);
    });

    let group: Set<L.Map> | undefined;
    if (syncKey) {
      group = GROUPS.get(syncKey) ?? new Set();
      GROUPS.set(syncKey, group);
      group.add(m);
      m.on("moveend", () => {
        if (syncing) return;
        syncing = true;
        group!.forEach((o) => {
          if (o !== m) o.setView(m.getCenter(), m.getZoom(), { animate: false });
        });
        syncing = false;
      });
    }
    const ro = new ResizeObserver(() => m.invalidateSize());
    ro.observe(el.current);
    return () => {
      ro.disconnect();
      group?.delete(m);
      m.remove();
      polys.current = [];
      marker.current = null;
    };
    // the map is rebuilt only when the geometry changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segs, flags, syncKey]);

  useEffect(() => {
    polys.current.forEach((pl, i) => {
      const c = colors[i];
      pl.setStyle({ color: c ?? NO_DATA, opacity: c ? 0.97 : 0.5, weight: c ? 6 : 4 });
    });
  }, [colors, segs, flags, syncKey]);

  useEffect(() => {
    const s = segsRef.current[cur];
    if (marker.current && s) marker.current.setLatLngs([s.a, s.b]);
  }, [cur, segs, flags, syncKey]);

  return <div ref={el} className="h-full w-full" role="application" aria-label={ariaLabel} />;
}
