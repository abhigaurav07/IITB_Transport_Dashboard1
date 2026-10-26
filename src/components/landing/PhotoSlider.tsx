"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import HeroGraphic from "@/components/vault/HeroGraphic";
import ProjectArt from "@/components/vault/ProjectArt";

const MAX = 8;
const INTERVAL = 5000;

function reducedMotion() {
  const q = window.matchMedia("(prefers-reduced-motion: reduce)");
  return { q, get: () => q.matches };
}
const subscribeMotion = (cb: () => void) => {
  const { q } = reducedMotion();
  q.addEventListener("change", cb);
  return () => q.removeEventListener("change", cb);
};

type Slide = { key: string; label: string; node: React.ReactNode };

const ILLUSTRATIONS: Slide[] = [
  { key: "alignment", label: "Road alignment illustration", node: <HeroGraphic className="h-full w-full bg-surface p-6" /> },
  { key: "bridge", label: "Bridge profile illustration", node: <ProjectArt project={{ slug: "atal-setu" }} /> },
  { key: "profile", label: "Longitudinal profile illustration", node: <ProjectArt project={{ slug: "kasara" }} /> },
];

/**
 * Sliding gallery. Shows /public/iitb/slide-1.jpg, slide-2.jpg, ... when they
 * exist, and abstract illustrations until then. Auto-advances, pauses on hover,
 * focus or the pause button, and does not move for people who prefer reduced motion.
 */
export default function PhotoSlider({ className = "" }: { className?: string }) {
  const [photos, setPhotos] = useState<string[] | null>(null);
  const [idx, setIdx] = useState(0);
  const [hover, setHover] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const reduced = useSyncExternalStore(subscribeMotion, () => reducedMotion().get(), () => false);

  useEffect(() => {
    let live = true;
    Promise.all(
      Array.from({ length: MAX }, (_, i) => `/iitb/slide-${i + 1}.jpg`).map(
        (src) =>
          new Promise<string | null>((res) => {
            const im = new Image();
            im.onload = () => res(src);
            im.onerror = () => res(null);
            im.src = src;
          }),
      ),
    ).then((r) => {
      if (!live) return;
      // Keep the unbroken run from slide-1 so a missing number ends the gallery.
      const run: string[] = [];
      for (const s of r) {
        if (!s) break;
        run.push(s);
      }
      setPhotos(run);
    });
    return () => {
      live = false;
    };
  }, []);

  const slides: Slide[] = photos && photos.length ? photos.map((src, i) => ({ key: src, label: `IIT Bombay campus, photograph ${i + 1}`, node: (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="IIT Bombay campus" className="h-full w-full object-cover" draggable={false} />
  ) })) : ILLUSTRATIONS;
  const n = slides.length;
  const onPhotos = !!photos && photos.length > 0;
  const current = idx % n;
  const playing = !reduced && !userPaused && !hover && n > 1;

  const go = useCallback((to: number) => setIdx(((to % n) + n) % n), [n]);
  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % n), INTERVAL);
    return () => clearInterval(t);
  }, [playing, n]);

  const btn = "flex h-9 w-9 items-center justify-center rounded-full border border-line bg-white/95 text-[#17365d] shadow-card hover:bg-white";

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label="IIT Bombay gallery"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
      className={`relative overflow-hidden rounded-2xl border border-line bg-canvas shadow-lift ${className}`}
    >
      {photos === null ? null : (
        <div className="flex h-full w-full transition-transform duration-700 ease-out motion-reduce:transition-none" style={{ transform: `translateX(-${current * 100}%)` }} aria-live={playing ? "off" : "polite"}>
          {slides.map((s, i) => (
            <div key={s.key} role="group" aria-roledescription="slide" aria-label={`${i + 1} of ${n}: ${s.label}`} aria-hidden={i !== current} className="h-full w-full shrink-0">
              {s.node}
            </div>
          ))}
        </div>
      )}

      {n > 1 && photos !== null ? (
        <>
          {onPhotos ? <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-navy/40 to-transparent" aria-hidden /> : null}
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 px-4 pb-3.5">
            <div className="flex items-center gap-1.5">
              {slides.map((s, i) => (
                <button key={s.key} type="button" onClick={() => go(i)} aria-label={`Go to slide ${i + 1}`} aria-current={i === current} className="group flex h-6 items-center">
                  <span className={`block h-1.5 rounded-full transition-all ${i === current ? (onPhotos ? "w-6 bg-white" : "w-6 bg-navy") : onPhotos ? "w-1.5 bg-white/60 group-hover:bg-white" : "w-1.5 bg-navy/30 group-hover:bg-navy/60"}`} />
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              {!reduced ? (
                <button type="button" onClick={() => setUserPaused((p) => !p)} aria-label={userPaused ? "Play slideshow" : "Pause slideshow"} className={btn}>
                  {userPaused ? (
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden><path d="M8 5v14l11-7z" /></svg>
                  ) : (
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" /></svg>
                  )}
                </button>
              ) : null}
              <button type="button" onClick={() => go(current - 1)} aria-label="Previous slide" className={btn}>
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="m15 6-6 6 6 6" /></svg>
              </button>
              <button type="button" onClick={() => go(current + 1)} aria-label="Next slide" className={btn}>
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="m9 6 6 6-6 6" /></svg>
              </button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
