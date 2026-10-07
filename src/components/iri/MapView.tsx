"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { View } from "./view";
import { colorCss } from "@/lib/iri/scale";
import { fmtCh } from "@/lib/iri/format";

export type Basemap = "light" | "streets" | "osm" | "none";

const TILES: Record<Exclude<Basemap, "none">, { url: string; attr: string; sub?: string }> = {
  light: { url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", attr: "© OpenStreetMap contributors © CARTO", sub: "abcd" },
  streets: { url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}", attr: "Tiles © Esri" },
  osm: { url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png", attr: "© OpenStreetMap contributors" },
};
const BASE_OPACITY = 0.45;

/** Leaflet map: the shown route coloured block by block, other routes in grey, a marker on the current block. */
export default function MapView({ v, basemap }: { v: View; basemap: Basemap }) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const tile = useRef<L.TileLayer | null>(null);
  const group = useRef<L.LayerGroup | null>(null);
  const blocks = useRef<L.Polyline[]>([]);
  const marker = useRef<L.Polyline | null>(null);
  const pts = useRef<L.LatLngTuple[]>([]);
  const live = useRef({ n: 0, setCur: v.setCur });

  useEffect(() => {
    live.current = { n: v.route.n, setCur: v.setCur };
  });

  // create the map once
  useEffect(() => {
    if (!el.current) return;
    const m = L.map(el.current, { preferCanvas: true, zoomControl: true, attributionControl: true });
    L.control.scale({ imperial: false }).addTo(m);
    m.setView([19.2, 73.4], 10);
    map.current = m;
    group.current = L.layerGroup().addTo(m);
    const nearest = (e: L.LeafletMouseEvent, maxPx: number) => {
      const P = pts.current;
      if (P.length < 2) return -1;
      const p = m.latLngToLayerPoint(e.latlng);
      let best = -1;
      let bd = 1e12;
      let a = m.latLngToLayerPoint(P[0]);
      for (let i = 0; i < P.length - 1; i++) {
        const b = m.latLngToLayerPoint(P[i + 1]);
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const l2 = dx * dx + dy * dy;
        let u = l2 ? ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2 : 0;
        u = Math.max(0, Math.min(1, u));
        const qx = a.x + u * dx - p.x;
        const qy = a.y + u * dy - p.y;
        const d = qx * qx + qy * qy;
        if (d < bd) {
          bd = d;
          best = i;
        }
        a = b;
      }
      return bd < maxPx * maxPx ? best : -1;
    };
    m.on("mousemove", (e: L.LeafletMouseEvent) => {
      const i = nearest(e, 26);
      if (i >= 0) live.current.setCur(i);
    });
    m.on("click", (e: L.LeafletMouseEvent) => {
      const i = nearest(e, 40);
      if (i >= 0) live.current.setCur(i);
    });
    const ro = new ResizeObserver(() => m.invalidateSize());
    ro.observe(el.current);
    return () => {
      ro.disconnect();
      m.remove();
      map.current = null;
      tile.current = null;
      group.current = null;
    };
  }, []);

  // base map
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    if (tile.current) {
      m.removeLayer(tile.current);
      tile.current = null;
    }
    if (basemap !== "none") {
      const t = TILES[basemap];
      tile.current = L.tileLayer(t.url, { attribution: t.attr, subdomains: t.sub ?? "abc", opacity: BASE_OPACITY, maxZoom: 19 }).addTo(m);
      tile.current.setZIndex(1);
    }
  }, [basemap]);

  // route geometry
  const route = v.route;
  useEffect(() => {
    const m = map.current;
    const g = group.current;
    if (!m || !g) return;
    g.clearLayers();
    v.routes.forEach((r) => {
      if (r.id !== route.id) {
        g.addLayer(L.polyline(r.lat.map((la, i) => [la, r.lon[i]] as L.LatLngTuple), { color: "#94a3b8", weight: 4, opacity: 0.6 }).bindTooltip(r.name, { sticky: true }));
      }
    });
    const P = route.lat.map((la, i) => [la, route.lon[i]] as L.LatLngTuple);
    pts.current = P;
    g.addLayer(L.polyline(P, { color: "#64748b", weight: 10, opacity: 0.22, interactive: false }));
    blocks.current = [];
    for (let i = 0; i < route.n - 1; i++) {
      const pl = L.polyline([P[i], P[i + 1]], { weight: 6, lineCap: "round", opacity: 0.97, interactive: false });
      g.addLayer(pl);
      blocks.current.push(pl);
    }
    marker.current = L.polyline([P[0], P[1]], { weight: 13, color: "#0f172a", opacity: 0.85, lineCap: "round", interactive: false });
    g.addLayer(marker.current);
    const dot = (ll: L.LatLngTuple, tip: string) =>
      g.addLayer(L.circleMarker(ll, { radius: 7, color: "#ffffff", weight: 2, fillColor: "#0f172a", fillOpacity: 1 }).bindTooltip(tip));
    dot(P[0], "Start, chainage 0+000");
    dot(P[P.length - 1], `End, chainage ${fmtCh(route.km[route.n - 1])}`);
    m.invalidateSize();
    m.fitBounds(L.latLngBounds(P), { padding: [24, 24] });
  }, [route, v.routes]);

  // colours
  useEffect(() => {
    blocks.current.forEach((pl, i) => {
      const val = v.series[i];
      pl.setStyle({ color: colorCss(val, v.color), opacity: val == null ? 0.5 : 0.97, weight: val == null ? 4 : 6 });
    });
  }, [v.series, v.color, route]);

  // marker
  useEffect(() => {
    const i = Math.min(v.cur, route.n - 2);
    const P = pts.current;
    if (marker.current && P[i] && P[i + 1]) marker.current.setLatLngs([P[i], P[i + 1]]);
  }, [v.cur, route]);

  return <div ref={el} className="h-full w-full" role="application" aria-label="Route map coloured by IRI" />;
}
