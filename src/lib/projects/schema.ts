import { CATEGORIES, EMPTY_CLIENT, STATUSES, type ProjectInput, type ProjectLink } from "./types";

/**
 * The Create New Project form is rendered from this file. To add a field to
 * steps 1 to 3, add one entry to the matching step in STEPS (and its key to
 * FormState), or add a project-specific field to EXTRA_FIELDS below.
 */
export type FieldKind = "text" | "email" | "tel" | "textarea" | "select" | "date" | "tags" | "links" | "image";

/** Everything the form edits, flat so each field has one key. */
export interface FormState {
  projectId: string;
  title: string;
  summary: string;
  description: string;
  category: string;
  status: string;
  owner: string;
  team: string[];
  organisation: string;
  location: string;
  tags: string[];
  links: ProjectLink[];
  cover: string;
  clientOrg: string;
  contactName: string;
  designation: string;
  email: string;
  phone: string;
  additional: string;
  startDate: string;
  endDate: string;
  extra: Record<string, string>;
}

export interface FieldDef {
  key: Exclude<keyof FormState, "extra">;
  label: string;
  kind: FieldKind;
  required?: boolean;
  placeholder?: string;
  hint?: string;
  options?: readonly string[];
  maxLength?: number;
  /** "more" fields sit under an "Additional details" subheading. */
  group?: "more";
  wide?: boolean;
}

export interface StepDef {
  id: "identity" | "client" | "timeline" | "datasets" | "review";
  title: string;
  blurb: string;
  fields: FieldDef[];
}

export const STEPS: StepDef[] = [
  {
    id: "identity",
    title: "Project Identity",
    blurb: "What the project is and who leads it.",
    fields: [
      { key: "projectId", label: "Project ID", kind: "text", required: true, hint: "Generated automatically. Must be unique.", maxLength: 32 },
      { key: "title", label: "Project title", kind: "text", required: true, placeholder: "e.g. Mumbai–Pune Expressway IRI study", maxLength: 90, wide: true },
      { key: "summary", label: "Short summary", kind: "text", required: true, placeholder: "One line shown on the project card", maxLength: 160, wide: true },
      { key: "description", label: "Description", kind: "textarea", placeholder: "Aim, method and outcome, in a few lines", maxLength: 1500, wide: true },
      { key: "category", label: "Category", kind: "select", required: true, options: CATEGORIES },
      { key: "status", label: "Status", kind: "select", required: true, options: STATUSES },
      { key: "owner", label: "Owner or PI", kind: "text", required: true, placeholder: "Name" },
      { key: "team", label: "Team members", kind: "tags", placeholder: "Type a name, press Enter", wide: true },
      { key: "organisation", label: "Institute or department", kind: "text", placeholder: "IIT Bombay", group: "more" },
      { key: "location", label: "Location or region", kind: "text", placeholder: "e.g. Maharashtra, India", group: "more" },
      { key: "tags", label: "Tags", kind: "tags", placeholder: "Type a keyword, press Enter", group: "more", wide: true },
      { key: "links", label: "Links", kind: "links", hint: "GitHub, papers, external datasets", group: "more", wide: true },
      { key: "cover", label: "Cover image", kind: "image", hint: "Wide images work best.", group: "more", wide: true },
    ],
  },
  {
    id: "client",
    title: "Client and Contacts",
    blurb: "Who the work is for. Every field is optional.",
    fields: [
      { key: "clientOrg", label: "Client or organisation", kind: "text", maxLength: 120, wide: true },
      { key: "contactName", label: "Primary contact name", kind: "text", maxLength: 90 },
      { key: "designation", label: "Designation", kind: "text", maxLength: 90 },
      { key: "email", label: "Email", kind: "email", placeholder: "name@organisation.in", maxLength: 120 },
      { key: "phone", label: "Phone", kind: "tel", placeholder: "+91 …", maxLength: 30 },
      { key: "additional", label: "Additional contact information", kind: "textarea", placeholder: "Alternate contact, address, notes", maxLength: 600, wide: true },
    ],
  },
  {
    id: "timeline",
    title: "Project Timeline",
    blurb: "When the work runs. The creation time is recorded by the system when you save.",
    fields: [
      { key: "startDate", label: "Project start date", kind: "date" },
      { key: "endDate", label: "Project end date", kind: "date", hint: "If applicable" },
    ],
  },
  { id: "datasets", title: "Raw Dataset Upload", blurb: "Raw data files collected for this project.", fields: [] },
  { id: "review", title: "Review and Save", blurb: "Check everything, then save the project.", fields: [] },
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

export const EMPTY_FORM: FormState = {
  projectId: "",
  title: "",
  summary: "",
  description: "",
  category: "Transport",
  status: "Ongoing",
  owner: "",
  team: [],
  organisation: "IIT Bombay",
  location: "",
  tags: [],
  links: [],
  cover: "",
  clientOrg: "",
  contactName: "",
  designation: "",
  email: "",
  phone: "",
  additional: "",
  startDate: "",
  endDate: "",
  extra: {},
};

export function toInput(f: FormState): ProjectInput {
  return {
    projectId: f.projectId.trim(),
    title: f.title.trim(),
    summary: f.summary.trim(),
    description: f.description.trim(),
    category: f.category as ProjectInput["category"],
    status: f.status as ProjectInput["status"],
    startDate: f.startDate,
    endDate: f.endDate,
    owner: f.owner.trim(),
    team: f.team,
    organisation: f.organisation.trim(),
    location: f.location.trim(),
    client: {
      ...EMPTY_CLIENT,
      organisation: f.clientOrg.trim(),
      contactName: f.contactName.trim(),
      designation: f.designation.trim(),
      email: f.email.trim(),
      phone: f.phone.trim(),
      additional: f.additional.trim(),
    },
    links: f.links.filter((l) => l.url.trim()).map((l) => ({ label: l.label.trim() || l.url.trim(), url: l.url.trim() })),
    files: [],
    cover: f.cover,
    tags: f.tags,
    extra: f.extra,
  };
}
