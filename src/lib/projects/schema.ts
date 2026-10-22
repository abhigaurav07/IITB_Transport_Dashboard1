import { CATEGORIES, STATUSES, type ProjectInput } from "./types";

/**
 * The Create New Project form is rendered from this file. To add a field,
 * add one entry to EXTRA_FIELDS below: it appears on the form, is stored
 * with the project and shows on the project page. No other file changes.
 */
export type FieldKind = "text" | "textarea" | "select" | "date" | "tags" | "links" | "files" | "image";

export interface FieldDef {
  key: keyof ProjectInput;
  label: string;
  kind: FieldKind;
  required?: boolean;
  placeholder?: string;
  hint?: string;
  options?: readonly string[];
  maxLength?: number;
}

export interface SectionDef {
  id: string;
  title: string;
  blurb: string;
  fields: FieldDef[];
}

export const SECTIONS: SectionDef[] = [
  {
    id: "core",
    title: "Core details",
    blurb: "What the project is and where it stands.",
    fields: [
      { key: "title", label: "Title", kind: "text", required: true, placeholder: "e.g. Mumbai–Pune Expressway IRI study", maxLength: 90 },
      { key: "summary", label: "Short summary", kind: "text", required: true, placeholder: "One line shown on the project card", maxLength: 160 },
      { key: "description", label: "Description", kind: "textarea", placeholder: "Aim, method and outcome, in a few lines", maxLength: 1500 },
      { key: "category", label: "Category", kind: "select", required: true, options: CATEGORIES },
      { key: "status", label: "Status", kind: "select", required: true, options: STATUSES },
      { key: "startDate", label: "Start date", kind: "date" },
      { key: "endDate", label: "End date", kind: "date" },
    ],
  },
  {
    id: "people",
    title: "People and place",
    blurb: "Who is involved and where it happens.",
    fields: [
      { key: "owner", label: "Owner or PI", kind: "text", required: true, placeholder: "Name" },
      { key: "team", label: "Team members", kind: "tags", placeholder: "Type a name, press Enter" },
      { key: "organisation", label: "Institute or department", kind: "text", placeholder: "IIT Bombay" },
      { key: "location", label: "Location or region", kind: "text", placeholder: "e.g. Maharashtra, India" },
    ],
  },
  {
    id: "files",
    title: "Files and links",
    blurb: "Reports, data and references for this project.",
    fields: [
      { key: "links", label: "Links", kind: "links", hint: "GitHub, papers, datasets" },
      { key: "files", label: "Files", kind: "files", hint: "PDF, CSV, images" },
    ],
  },
  {
    id: "cover",
    title: "Cover and tags",
    blurb: "How the project looks in the list and how it is found.",
    fields: [
      { key: "cover", label: "Cover image", kind: "image", hint: "Optional. Wide images work best." },
      { key: "tags", label: "Tags", kind: "tags", placeholder: "Type a keyword, press Enter" },
    ],
  },
];

export interface ExtraFieldDef {
  id: string;
  label: string;
  kind: "text" | "textarea" | "select";
  options?: readonly string[];
  placeholder?: string;
}

/** Add project-specific fields here later. Empty for now. */
export const EXTRA_FIELDS: ExtraFieldDef[] = [];

export const EMPTY_INPUT: ProjectInput = {
  title: "",
  summary: "",
  description: "",
  category: "Transport",
  status: "Ongoing",
  startDate: "",
  endDate: "",
  owner: "",
  team: [],
  organisation: "IIT Bombay",
  location: "",
  links: [],
  files: [],
  cover: "",
  tags: [],
  extra: {},
};
