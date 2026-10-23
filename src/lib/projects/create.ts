"use client";

import { buildProject, commitDatasets, commitProject, getDatasets, nextProjectId, getProjects } from "./store";
import { deleteFile, freeSpace, putFile, sha256Hex } from "./files";
import { extOf } from "./datasetFiles";
import type { Dataset, Project, ProjectInput } from "./types";

/** A file the user has selected, with the metadata typed so far. Nothing is stored yet. */
export interface DatasetDraft {
  localId: string;
  file: File;
  name: string;
  category: string;
  description: string;
  periodFrom: string;
  periodTo: string;
  remarks: string;
}

export type DraftState = { state: "selected" | "saving" | "failed"; error?: string };
export type StatusMap = Record<string, DraftState>;

type Report = (localId: string, s: DraftState) => void;

const uid = () => Math.random().toString(36).slice(2, 8);

/**
 * Writes the exact bytes of each file to the browser file store and returns
 * the metadata records. All or nothing: if one file fails, files already
 * written in this call are removed again and nothing is returned as saved.
 */
async function storeFiles(projectRef: string, drafts: DatasetDraft[], report: Report): Promise<{ ok: true; datasets: Dataset[] } | { ok: false; error: string }> {
  const total = drafts.reduce((n, d) => n + d.file.size, 0);
  const free = await freeSpace();
  if (free !== null && total > free * 0.9) {
    const msg = "Not enough browser storage for these files. Remove some files and try again.";
    drafts.forEach((d) => report(d.localId, { state: "failed", error: msg }));
    return { ok: false, error: msg };
  }
  const written: string[] = [];
  const out: Dataset[] = [];
  for (const d of drafts) {
    report(d.localId, { state: "saving" });
    const id = `ds-${Date.now().toString(36)}-${uid()}`;
    const fileKey = `file-${id}`;
    try {
      const sha256 = await sha256Hex(d.file);
      await putFile(fileKey, d.file);
      written.push(fileKey);
      out.push({
        id,
        projectRef,
        kind: "raw",
        name: d.name.trim(),
        category: d.category.trim(),
        originalFilename: d.file.name,
        format: extOf(d.file.name).toUpperCase(),
        mimeType: d.file.type || "application/octet-stream",
        size: d.file.size,
        description: d.description.trim(),
        periodFrom: d.periodFrom,
        periodTo: d.periodTo,
        remarks: d.remarks.trim(),
        uploadedAt: new Date().toISOString(),
        storage: "browser",
        fileKey,
        sha256,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "The file could not be stored.";
      await Promise.allSettled(written.map(deleteFile));
      drafts.forEach((x) => report(x.localId, x.localId === d.localId ? { state: "failed", error: msg } : { state: "selected" }));
      return { ok: false, error: `${d.file.name}: ${msg}` };
    }
  }
  return { ok: true, datasets: out };
}

const discard = (ds: Dataset[]) => Promise.allSettled(ds.map((d) => deleteFile(d.fileKey)));

export type CreateOutcome = { ok: true; project: Project; datasetCount: number } | { ok: false; error: string };

/** Creates the project and stores its datasets as one operation. */
export async function createProjectWithDatasets(input: ProjectInput, drafts: DatasetDraft[], report: Report, opts: { autoId: boolean }): Promise<CreateOutcome> {
  const fresh = opts.autoId ? { ...input, projectId: nextProjectId(getProjects()) } : input;
  const project = buildProject(fresh);
  const stored = await storeFiles(project.id, drafts, report);
  if (!stored.ok) return { ok: false, error: stored.error };
  const r = commitProject(project, stored.datasets);
  if (!r.ok) {
    await discard(stored.datasets);
    drafts.forEach((d) => report(d.localId, { state: "selected" }));
    return { ok: false, error: r.error };
  }
  return { ok: true, project: r.project, datasetCount: stored.datasets.length };
}

/** Adds datasets to an existing project. Rejects a file name the project already has. */
export async function addDatasetsToProject(projectRef: string, drafts: DatasetDraft[], report: Report): Promise<{ ok: true; count: number } | { ok: false; error: string }> {
  const have = new Set(getDatasets().filter((d) => d.projectRef === projectRef).map((d) => d.originalFilename.toLowerCase()));
  const dup = drafts.find((d) => have.has(d.file.name.toLowerCase()));
  if (dup) {
    const msg = "This project already has a dataset with this file name. Existing datasets are not replaced; rename the file to add it as a new dataset.";
    report(dup.localId, { state: "failed", error: msg });
    return { ok: false, error: `${dup.file.name}: ${msg}` };
  }
  const stored = await storeFiles(projectRef, drafts, report);
  if (!stored.ok) return { ok: false, error: stored.error };
  const r = commitDatasets(stored.datasets);
  if (!r.ok) {
    await discard(stored.datasets);
    drafts.forEach((d) => report(d.localId, { state: "selected" }));
    return { ok: false, error: r.error };
  }
  return { ok: true, count: stored.datasets.length };
}

export type DraftErrors = Partial<Record<"name" | "category" | "period", string>>;

export function draftErrors(d: DatasetDraft): DraftErrors {
  const e: DraftErrors = {};
  if (!d.name.trim()) e.name = "Required";
  if (!d.category.trim()) e.category = "Choose or enter a category";
  else if (d.category.trim().length > 40) e.category = "Keep the category under 40 characters";
  if (d.periodFrom && d.periodTo && d.periodTo < d.periodFrom) e.period = "End is before the start";
  return e;
}
