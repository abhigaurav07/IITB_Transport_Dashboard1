export const STATUSES = ["Planned", "Ongoing", "Completed"] as const;
export type ProjectStatus = (typeof STATUSES)[number];

export const CATEGORIES = [
  "Transport",
  "Blockchain and security",
  "Telecom and networks",
  "Coursework and teaching",
  "Other",
] as const;
export type ProjectCategory = (typeof CATEGORIES)[number];

export interface ProjectLink {
  label: string;
  url: string;
}

/** Legacy field from the first prototype (names only). New projects keep real files as datasets. */
export interface ProjectFile {
  name: string;
  size: number;
}

/**
 * Client and contact details. Treated as sensitive: they are stored with the
 * project record but kept in one object so the shared version can restrict
 * who may read them (for example, signed-in editors only).
 */
export interface ClientInfo {
  organisation: string;
  contactName: string;
  designation: string;
  email: string;
  phone: string;
  /** Free text: alternate contact, address, or notes. */
  additional: string;
}

export const EMPTY_CLIENT: ClientInfo = { organisation: "", contactName: "", designation: "", email: "", phone: "", additional: "" };

export interface Project {
  /** Internal record key. Datasets reference this, never the slug or the display ID. */
  id: string;
  /** Human-facing, unique project ID, e.g. TPV-2026-0004. */
  projectId: string;
  slug: string;
  title: string;
  summary: string;
  description: string;
  category: ProjectCategory;
  status: ProjectStatus;
  startDate: string;
  endDate: string;
  owner: string;
  team: string[];
  organisation: string;
  location: string;
  client: ClientInfo;
  links: ProjectLink[];
  files: ProjectFile[];
  /** Small cover image as a data URL (local preview mode) or a storage URL (database mode). */
  cover: string;
  tags: string[];
  /** Values for the optional extra fields declared in schema.ts. */
  extra: Record<string, string>;
  /** System-generated when the record is saved. Separate from startDate. */
  createdAt: string;
  /** Projects that already have a built interface open there instead of the generic record page. */
  href?: string;
}

export type ProjectInput = Omit<Project, "id" | "slug" | "createdAt" | "href">;

/** Raw dataset categories offered by default. Projects may add their own. */
export const DATASET_CATEGORIES = [
  "Traffic Survey Data",
  "GPS / VBOX Data",
  "GIS and Spatial Data",
  "Road Roughness / IRI Data",
  "Survey and Field Records",
  "Reports and References",
  "Other",
] as const;

/**
 * Metadata for one raw dataset file. One project has many datasets; each
 * dataset belongs to exactly one project (projectRef = Project.id). The file
 * itself is not part of this record: fileKey points to it in the file store.
 */
export interface Dataset {
  id: string;
  projectRef: string;
  /** Raw data as collected. Processed data and results are not stored as datasets. */
  kind: "raw";
  name: string;
  category: string;
  originalFilename: string;
  /** Upper-case extension, e.g. CSV. */
  format: string;
  mimeType: string;
  size: number;
  description: string;
  /** Collection period or single data date (YYYY-MM-DD). Either may be empty. */
  periodFrom: string;
  periodTo: string;
  remarks: string;
  uploadedAt: string;
  /** Where the bytes live. "browser" = this browser only; "remote" is reserved for managed storage. */
  storage: "browser" | "remote";
  fileKey: string;
  /** SHA-256 of the exact bytes stored, as hex. Empty if the browser could not compute it. */
  sha256: string;
}

/** A link or reference added to a project after it was created. */
export interface ProjectResource {
  id: string;
  label: string;
  url: string;
  note: string;
  addedAt: string;
}

export const MODULE_STATUSES = ["Planned", "In progress", "Completed"] as const;
export type ModuleStatus = (typeof MODULE_STATUSES)[number];

/**
 * A module recorded from the interface. It names an analysis and can point to
 * where the work lives (a link). Modules with their own built pages are
 * registered in modules.ts instead.
 */
export interface CustomModule {
  id: string;
  name: string;
  description: string;
  status: ModuleStatus;
  link: string;
  addedAt: string;
}

export interface ProjectAdditions {
  resources: ProjectResource[];
  modules: CustomModule[];
}
