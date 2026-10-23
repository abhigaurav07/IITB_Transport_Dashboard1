"use client";

import { useSyncExternalStore } from "react";
import { EMPTY_CLIENT, type Dataset, type Project, type ProjectInput } from "./types";
import { SEED } from "./seed";

/**
 * Project and dataset metadata store. Today it keeps new records in this
 * browser only (preview mode); file bytes live in the browser file store
 * (files.ts). When the database is connected, replace the bodies of the
 * functions below. Pages and components only use the exports.
 */
export const STORE_MODE: "local" | "database" = "local";

const KEY = "tp.projects.v1";
const DS_KEY = "tp.datasets.v1";

export { SEED };

export const PROJECT_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._/-]{2,31}$/;

const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY || e.key === DS_KEY) cb();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

function rawGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

/* ---------- ID helpers ---------- */

export function nextProjectId(all: Pick<Project, "projectId">[], year = new Date().getFullYear()): string {
  const re = new RegExp(`^TPV-${year}-(\\d{4,})$`);
  let max = 0;
  for (const p of all) {
    const m = p.projectId.match(re);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return `TPV-${year}-${String(max + 1).padStart(4, "0")}`;
}

export function isProjectIdTaken(id: string, all: Pick<Project, "projectId">[] = getProjects()): boolean {
  const n = id.trim().toLowerCase();
  return all.some((p) => p.projectId.toLowerCase() === n);
}

/* ---------- Projects ---------- */

let pRaw: string | null = null;
let pList: Project[] = SEED;

/** Older records (saved before project IDs and client details existed) are upgraded in memory. */
function normalise(own: Project[]): Project[] {
  const out: Project[] = [];
  for (const p of own) {
    const known = [...SEED, ...out];
    let projectId = p.projectId;
    if (!projectId || isProjectIdTaken(projectId, known)) {
      const y = Number(p.createdAt?.slice(0, 4)) || new Date().getFullYear();
      projectId = nextProjectId(known, y);
    }
    out.push({ ...p, projectId, client: { ...EMPTY_CLIENT, ...(p.client ?? {}) }, files: p.files ?? [], links: p.links ?? [], team: p.team ?? [], tags: p.tags ?? [], extra: p.extra ?? {} });
  }
  return out;
}

function readProjects(): Project[] {
  if (typeof window === "undefined") return SEED;
  const raw = rawGet(KEY);
  if (raw === pRaw) return pList;
  pRaw = raw;
  try {
    const own = raw ? (JSON.parse(raw) as Project[]) : [];
    pList = [...SEED, ...normalise(own)];
  } catch {
    pList = SEED;
  }
  return pList;
}

export const getProjects = readProjects;

export function useProjects(): Project[] {
  return useSyncExternalStore(subscribe, readProjects, () => SEED);
}

export function useProject(slug: string): Project | undefined {
  return useProjects().find((p) => p.slug === slug);
}

/** False during server rendering and the first client render, true afterwards. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function slugify(s: string) {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "project"
  );
}

/** Builds a project record (internal id, slug, timestamp) without saving it. */
export function buildProject(input: ProjectInput): Project {
  const all = readProjects();
  const base = slugify(input.title);
  let slug = base;
  // Slugs must not collide with each other or with built-in routes such as "new".
  for (let i = 2; slug === "new" || all.some((p) => p.slug === slug); i++) slug = `${base}-${i}`;
  return {
    ...input,
    projectId: input.projectId.trim() || nextProjectId(all),
    id: `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    slug,
    createdAt: new Date().toISOString(),
  };
}

/* ---------- Datasets ---------- */

let dRaw: string | null = null;
let dList: Dataset[] = [];
const NONE: Dataset[] = [];

export function getDatasets(): Dataset[] {
  if (typeof window === "undefined") return NONE;
  const raw = rawGet(DS_KEY);
  if (raw === dRaw) return dList;
  dRaw = raw;
  try {
    dList = raw ? (JSON.parse(raw) as Dataset[]) : NONE;
  } catch {
    dList = NONE;
  }
  return dList;
}

export function useAllDatasets(): Dataset[] {
  return useSyncExternalStore(subscribe, getDatasets, () => NONE);
}

/** Dataset categories already in use anywhere, for the category picker. */
export function usedCategories(all: Dataset[]): string[] {
  return Array.from(new Set(all.map((d) => d.category)));
}

/* ---------- Writes ---------- */

export type CommitResult = { ok: true; project: Project } | { ok: false; code: "duplicate-id" | "storage"; error: string };

function restore(key: string, prev: string | null) {
  try {
    if (prev === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, prev);
  } catch {
    /* nothing more can be done */
  }
}

/** Saves a project and its dataset metadata together. If either write fails, neither is kept. */
export function commitProject(project: Project, datasets: Dataset[]): CommitResult {
  const all = readProjects();
  if (isProjectIdTaken(project.projectId, all)) return { ok: false, code: "duplicate-id", error: `Project ID ${project.projectId} is already used by another project.` };
  const prevP = rawGet(KEY);
  const prevD = rawGet(DS_KEY);
  try {
    const own = all.filter((p) => !SEED.some((s) => s.id === p.id));
    window.localStorage.setItem(KEY, JSON.stringify([...own, project]));
    if (datasets.length) window.localStorage.setItem(DS_KEY, JSON.stringify([...getDatasets(), ...datasets]));
  } catch {
    restore(KEY, prevP);
    restore(DS_KEY, prevD);
    return { ok: false, code: "storage", error: "Could not save in this browser. Remove the cover image or free some browser storage and try again." };
  }
  notify();
  return { ok: true, project };
}

/** Adds datasets to an existing project. Existing datasets are never replaced. */
export function commitDatasets(datasets: Dataset[]): { ok: true } | { ok: false; error: string } {
  const prevD = rawGet(DS_KEY);
  try {
    window.localStorage.setItem(DS_KEY, JSON.stringify([...getDatasets(), ...datasets]));
  } catch {
    restore(DS_KEY, prevD);
    return { ok: false, error: "Could not save the dataset records in this browser." };
  }
  notify();
  return { ok: true };
}
