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

export interface ProjectFile {
  name: string;
  size: number;
}

export interface Project {
  id: string;
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
  links: ProjectLink[];
  files: ProjectFile[];
  /** Small cover image as a data URL (local preview mode) or a storage URL (database mode). */
  cover: string;
  tags: string[];
  /** Values for the optional extra fields declared in schema.ts. */
  extra: Record<string, string>;
  createdAt: string;
  /** Projects that already have a built interface open there instead of the generic record page. */
  href?: string;
}

export type ProjectInput = Omit<Project, "id" | "slug" | "createdAt" | "href">;
