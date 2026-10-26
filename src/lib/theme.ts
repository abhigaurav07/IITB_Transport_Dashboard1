"use client";

import { useSyncExternalStore } from "react";

export type Theme = "light" | "dark";
const KEY = "tp.theme";

/**
 * The page always carries data-theme on <html>. A small inline script in the
 * root layout sets it before first paint from the saved choice, or from the
 * system preference when nothing has been chosen, so there is no flash.
 */
function current(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function subscribe(cb: () => void) {
  const obs = new MutationObserver(cb);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  // Follow the system setting while the user has not chosen a theme.
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  const onSystem = () => {
    let saved: string | null = null;
    try {
      saved = window.localStorage.getItem(KEY);
    } catch {}
    if (saved !== "light" && saved !== "dark") apply(mq.matches ? "dark" : "light", false);
  };
  mq.addEventListener("change", onSystem);
  return () => {
    obs.disconnect();
    mq.removeEventListener("change", onSystem);
  };
}

function apply(t: Theme, animate: boolean) {
  const root = document.documentElement;
  if (animate && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    root.classList.add("theme-anim");
    window.setTimeout(() => root.classList.remove("theme-anim"), 320);
  }
  root.dataset.theme = t;
}

export function setTheme(t: Theme) {
  apply(t, true);
  try {
    window.localStorage.setItem(KEY, t);
  } catch {
    /* the choice still applies for this visit */
  }
}

export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, current, () => "light");
}

/** Inline script text for <head>: runs before paint. Kept tiny and dependency free. */
export const THEME_INIT_SCRIPT = `(function(){try{var s=localStorage.getItem("${KEY}");var d=s==="dark"||(s!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.dataset.theme=d?"dark":"light";}catch(e){document.documentElement.dataset.theme="light";}})();`;

/** Resolve a CSS variable (for canvas drawing, which cannot use var()). */
export function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/** Colours for the plain (non-data) parts of a map: route halo, other routes, current-block marker and its dots. */
export function mapInk() {
  return {
    halo: cssVar("--ink-faint") || "#64748b",
    other: cssVar("--chart-axis") || "#94a3b8",
    marker: cssVar("--chart-select") || "#0f172a",
    ring: cssVar("--chart-marker-ring") || "#ffffff",
  };
}
