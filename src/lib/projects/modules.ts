/**
 * Projects that have a built interface, and the modules inside each.
 * To add a module to a project, add one entry here and a page at
 * src/app/(app)/projects/<slug>/<module path>/page.tsx.
 */
export interface ModuleDef {
  /** Path segment under the project, e.g. "module-1". */
  path: string;
  /** "1" for numbered modules; omit for a project's only module. */
  number?: string;
  label: string;
  description: string;
}

export interface ProjectDef {
  slug: string;
  name: string;
  modules: ModuleDef[];
}

export const PROJECT_DEFS: ProjectDef[] = [
  {
    slug: "mumbai-pune-expressway",
    name: "Mumbai–Pune Expressway",
    modules: [
      { path: "data-collection", label: "Data Collection", description: "Daily chainage-wise survey progress tracker." },
    ],
  },
  {
    slug: "atal-setu",
    name: "Atal Setu",
    modules: [
      { path: "module-1", number: "1", label: "Road Roughness (IRI)", description: "Validated NSV IRI, compared with the model." },
    ],
  },
  {
    slug: "kasara",
    name: "Kasara",
    modules: [
      { path: "module-1", number: "1", label: "Road Roughness (IRI)", description: "Predicted IRI of every 50 m block, averaged across drivers." },
    ],
  },
];

export function projectDef(slug: string | undefined): ProjectDef | undefined {
  return PROJECT_DEFS.find((p) => p.slug === slug);
}

/** "/projects/<slug>/..." gives the project slug, anything else gives undefined. */
export function slugFromPath(pathname: string): string | undefined {
  const m = pathname.match(/^\/projects\/([^/]+)/);
  return m?.[1];
}

export interface PathCrumb {
  label: string;
  href?: string;
}

/** Breadcrumb trail for any /projects/<slug>/... workspace path. */
export function crumbsFor(pathname: string): PathCrumb[] {
  const slug = slugFromPath(pathname);
  const def = projectDef(slug);
  const trail: PathCrumb[] = [{ label: "Home", href: "/" }, { label: "Existing Projects", href: "/projects" }];
  if (!def) return trail;
  const home = `/projects/${def.slug}`;
  const rest = pathname.slice(home.length).replace(/^\/+|\/+$/g, "");
  const mod = def.modules.find((m) => m.path === rest.split("/")[0]);
  if (mod) {
    trail.push({ label: def.name, href: home });
    trail.push({ label: mod.number ? `Module ${mod.number}: ${mod.label}` : mod.label });
  } else {
    trail.push({ label: def.name });
  }
  return trail;
}
