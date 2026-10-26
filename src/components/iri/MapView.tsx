"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { View } from "./view";
import { colorCss } from "@/lib/iri/scale";
import { fmtCh } from "@/lib/iri/format";
import { mapInk, useTheme } from "@/lib/theme";

// The base map is fixed to OpenStreetMap, drawn faint so the IRI colours stand out.
const OSM_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const OSM_ATTR = "© OpenStreetMap contributors";
const BASE_OPACITY = 0.6;

/** Leaflet map: the shown route coloured block by block, other routes in grey, a marker on the current block. */
export default function MapView({ v }: { v: View }) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const tile = useRef<L.TileLayer | null>(null);
  const group = useRef<L.LayerGroup | null>(null);
  const blocks = useRef<L.Polyline[]>([]);
  const marker = useRef<L.Polyline | null>(null);
  const pts = useRef<L.LatLngTuple[]>([]);
  const live = useRef({ n: 0, setCur: v.setCur });
  const theme = useTheme();
  const deco = useRef<{ halo: L.Polyline | null; others: L.Polyline[]; dots: L.CircleMarker[] }>({ halo: null, others: [], dots: [] });

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

  // base map: OpenStreetMap only
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    tile.current = L.tileLayer(OSM_URL, { attribution: OSM_ATTR, opacity: BASE_OPACITY, maxZoom: 19 }).addTo(m);
    tile.current.setZIndex(1);
    return () => {
      tile.current?.remove();
      tile.current = null;
    };
  }, []);

  // route geometry
  const route = v.route;
  useEffect(() => {
    const m = map.current;
    const g = group.current;
    if (!m || !g) return;
    g.clearLayers();
    const ink = mapInk();
    deco.current = { halo: null, others: [], dots: [] };
    v.routes.forEach((r) => {
      if (r.id !== route.id) {
        const o = L.polyline(r.lat.map((la, i) => [la, r.lon[i]] as L.LatLngTuple), { color: ink.other, weight: 4, opacity: 0.5 }).bindTooltip(r.name, { sticky: true });
        deco.current.others.push(o);
        g.addLayer(o);
      }
    });
    const P = route.lat.map((la, i) => [la, route.lon[i]] as L.LatLngTuple);
    pts.current = P;
    deco.current.halo = L.polyline(P, { color: ink.halo, weight: 10, opacity: 0.22, interactive: false });
    g.addLayer(deco.current.halo);
    blocks.current = [];
    for (let i = 0; i < route.n - 1; i++) {
      const pl = L.polyline([P[i], P[i + 1]], { weight: 6, lineCap: "round", opacity: 0.97, interactive: false });
      g.addLayer(pl);
      blocks.current.push(pl);
    }
    marker.current = L.polyline([P[0], P[1]], { weight: 13, color: ink.marker, opacity: 0.85, lineCap: "round", interactive: false });
    g.addLayer(marker.current);
    const dot = (ll: L.LatLngTuple, tip: string) => {
      const d = L.circleMarker(ll, { radius: 7, color: ink.ring, weight: 2, fillColor: ink.marker, fillOpacity: 1 }).bindTooltip(tip);
      deco.current.dots.push(d);
      g.addLayer(d);
    };
    dot(P[0], "Start, chainage 0+000");
    dot(P[P.length - 1], `End, chainage ${fmtCh(route.km[route.n - 1])}`);
    m.invalidateSize();
    m.fitBounds(L.latLngBounds(P), { padding: [24, 24] });
  }, [route, v.routes]);

  // plain map furniture follows the theme
  useEffect(() => {
    const ink = mapInk();
    const d = deco.current;
    d.halo?.setStyle({ color: ink.halo });
    d.others.forEach((o) => o.setStyle({ color: ink.other }));
    d.dots.forEach((x) => x.setStyle({ color: ink.ring, fillColor: ink.marker }));
    marker.current?.setStyle({ color: ink.marker });
  }, [theme]);

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
