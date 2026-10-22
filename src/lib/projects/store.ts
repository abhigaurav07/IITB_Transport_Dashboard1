"use client";

import { useSyncExternalStore } from "react";
import type { Project, ProjectInput } from "./types";

/**
 * Project store. Today it keeps new projects in this browser only (preview
 * mode). When the database is connected, replace the body of these functions
 * with calls to it; pages and components only use the exports below.
 */
export const STORE_MODE: "local" | "database" = "local";

const KEY = "tp.projects.v1";

export const SEED: Project[] = [
  {
    id: "seed-mumbai-pune-expressway",
    slug: "mumbai-pune-expressway",
    title: "Mumbai\u2013Pune Expressway",
    summary: "Daily chainage-wise survey progress of the data collection along the 94.6 km expressway.",
    description:
      "Traffic and transportation data collection study for the Mumbai\u2013Pune Expressway (Yashwantrao Chavan Expressway). Tracks daily chainage-wise survey progress for each lane and direction.",
    category: "Transport",
    status: "Ongoing",
    startDate: "",
    endDate: "",
    owner: "IIT Bombay",
    team: [],
    organisation: "IIT Bombay",
    location: "Maharashtra, India",
    links: [],
    files: [],
    cover: "",
    tags: ["Data collection", "Survey", "Expressway"],
    extra: {},
    createdAt: "2026-08-28T00:00:00.000Z",
    href: "/projects/mumbai-pune-expressway",
  },
  {
    id: "seed-atal-setu",
    slug: "atal-setu",
    title: "Atal Setu",
    summary: "Road roughness (IRI): validated NSV IRI compared with the model.",
    description: "Road roughness (IRI) of Atal Setu, with the validated NSV IRI at 50 m resolution, the predicted IRI and a comparison between the two.",
    category: "Transport",
    status: "Ongoing",
    startDate: "",
    endDate: "",
    owner: "IIT Bombay",
    team: [],
    organisation: "IIT Bombay",
    location: "Mumbai, India",
    links: [],
    files: [],
    cover: "",
    tags: ["IRI", "NSV", "Road roughness"],
    extra: {},
    createdAt: "2026-08-27T00:00:00.000Z",
    href: "/projects/atal-setu",
  },
  {
    id: "seed-kasara",
    slug: "kasara",
    title: "Kasara",
    summary: "Road roughness (IRI): predicted IRI of every 50 m block, averaged across drivers.",
    description: "Road roughness (IRI) of the Kasara route, estimated for every 50 m block and averaged across drivers.",
    category: "Transport",
    status: "Ongoing",
    startDate: "",
    endDate: "",
    owner: "IIT Bombay",
    team: [],
    organisation: "IIT Bombay",
    location: "Maharashtra, India",
    links: [],
    files: [],
    cover: "",
    tags: ["IRI", "Road roughness"],
    extra: {},
    createdAt: "2026-08-26T00:00:00.000Z",
    href: "/projects/kasara",
  },
];

let cacheRaw: string | null = null;
let cacheList: Project[] = SEED;
const listeners = new Set<() => void>();

function read(): Project[] {
  if (typeof window === "undefined") return SEED;
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    raw = null;
  }
  if (raw === cacheRaw) return cacheList;
  cacheRaw = raw;
  try {
    const own = raw ? (JSON.parse(raw) as Project[]) : [];
    cacheList = [...SEED, ...own];
  } catch {
    cacheList = SEED;
  }
  return cacheList;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) cb();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

export function useProjects(): Project[] {
  return useSyncExternalStore(subscribe, read, () => SEED);
}

export function useProject(slug: string): Project | undefined {
  return useProjects().find((p) => p.slug === slug);
}

function slugify(s: string) {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "project"
  );
}

export type CreateResult = { ok: true; project: Project } | { ok: false; error: string };

export function createProject(input: ProjectInput): CreateResult {
  const all = read();
  const base = slugify(input.title);
  let slug = base;
  for (let i = 2; all.some((p) => p.slug === slug); i++) slug = `${base}-${i}`;
  const project: Project = {
    ...input,
    id: `p-${Date.now().toString(36)}`,
    slug,
    createdAt: new Date().toISOString(),
  };
  try {
    const own = all.filter((p) => !SEED.some((s) => s.id === p.id));
    window.localStorage.setItem(KEY, JSON.stringify([...own, project]));
  } catch {
    return { ok: false, error: "Could not save in this browser. Remove the cover image or free some browser storage and try again." };
  }
  listeners.forEach((l) => l());
  return { ok: true, project };
}
