"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MAP_HI, MAP_LO, type NsvBlock } from "@/lib/atal/nsv";
import { rampRgb, rgbCss } from "@/lib/iri/scale";
import { fmtCh } from "@/lib/iri/format";

const OSM_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const OSM_ATTR = "© OpenStreetMap contributors";

/** Leaflet map: every 50 m block coloured by its average IRI, with a marker on the selected block. */
export default function NsvMap({ blocks, cur, setCur }: { blocks: NsvBlock[]; cur: number; setCur: (i: number) => void }) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const marker = useRef<L.Polyline | null>(null);
  const pts = useRef<L.LatLngTuple[][]>([]);
  const live = useRef({ setCur });

  useEffect(() => {
    live.current = { setCur };
  });

  useEffect(() => {
    if (!el.current) return;
    const m = L.map(el.current, { preferCanvas: true });
    m.setView([18.97, 72.95], 11);
    map.current = m;
    L.control.scale({ imperial: false }).addTo(m);
    L.tileLayer(OSM_URL, { attribution: OSM_ATTR, opacity: 0.6, maxZoom: 19 }).addTo(m);
    const g = L.layerGroup().addTo(m);
    const P = blocks.map((b) => [[b.lat, b.lon], [b.endLat, b.endLon]] as L.LatLngTuple[]);
    pts.current = P;
    g.addLayer(L.polyline(P.map((s) => s[0]), { color: "#64748b", weight: 10, opacity: 0.22, interactive: false }));
    blocks.forEach((b, i) => {
      g.addLayer(L.polyline(P[i], { color: rgbCss(rampRgb(b.avg, MAP_LO, MAP_HI)), weight: 6, lineCap: "round", opacity: 0.97, interactive: false }));
    });
    marker.current = L.polyline(P[0], { weight: 13, color: "#0f172a", opacity: 0.85, lineCap: "round", interactive: false }).addTo(m);
    const dot = (ll: L.LatLngTuple, tip: string) =>
      g.addLayer(L.circleMarker(ll, { radius: 7, color: "#ffffff", weight: 2, fillColor: "#0f172a", fillOpacity: 1 }).bindTooltip(tip));
    dot(P[0][0], `Start, chainage ${fmtCh(blocks[0].startM / 1000)}`);
    dot(P[P.length - 1][1], `End, chainage ${fmtCh(blocks[blocks.length - 1].endM / 1000)}`);
    m.fitBounds(L.latLngBounds(P.map((s) => s[0])), { padding: [24, 24] });

    const nearest = (e: L.LeafletMouseEvent, maxPx: number) => {
      const p = m.latLngToLayerPoint(e.latlng);
      let best = -1;
      let bd = maxPx * maxPx;
      for (let i = 0; i < P.length; i++) {
        const a = m.latLngToLayerPoint(P[i][0]);
        const b = m.latLngToLayerPoint(P[i][1]);
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
    const ro = new ResizeObserver(() => m.invalidateSize());
    ro.observe(el.current);
    return () => {
      ro.disconnect();
      m.remove();
      map.current = null;
    };
  }, [blocks]);

  useEffect(() => {
    const s = pts.current[cur];
    if (marker.current && s) marker.current.setLatLngs(s);
  }, [cur]);

  return <div ref={el} className="h-full w-full" role="application" aria-label="Route map coloured by NSV IRI" />;
}
