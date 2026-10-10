export interface SubmoduleNavItem {
  href: string;
  /** "1", "2": shown as the submodule number. */
  number: string;
  label: string;
  description: string;
  status: "live" | "construction";
}

export interface ModuleNavItem {
  href: string;
  label: string;
  description: string;
  status: "live" | "construction";
  submodules?: SubmoduleNavItem[];
}

/** Submodules of Module 1 (Road Roughness). Shared by the sidebar, the hub page and the submodule bar. */
export const MODULE_1_SUBMODULES: SubmoduleNavItem[] = [
  {
    href: "/module-1/kasra-route-iri",
    number: "1",
    label: "KASRA Route IRI",
    description:
      "Predicted IRI of every 50 m block on the KASRA route, averaged across drivers, with chainage profile, driver coverage, map and drive-through views.",
    status: "live",
  },
  {
    href: "/module-1/submodule-2",
    number: "2",
    label: "Submodule 2",
    description: "Content and scope for this submodule will be provided at a later stage.",
    status: "construction",
  },
];

export const MODULES: ModuleNavItem[] = [
  {
    href: "/data-collection",
    label: "Data Collection",
    description: "Daily chainage wise survey progress tracker.",
    status: "live",
  },
  {
    href: "/module-1",
    label: "Road Roughness (IRI)",
    description: "Road roughness analysis, organised in submodules. Submodule 1 is the KASRA route IRI viewer.",
    status: "live",
    submodules: MODULE_1_SUBMODULES,
  },
  {
    href: "/module-2",
    label: "Module 2",
    description: "Content and scope for this module will be provided at a later stage.",
    status: "construction",
  },
  {
    href: "/module-3",
    label: "Module 3",
    description: "Content and scope for this module will be provided at a later stage.",
    status: "construction",
  },
  {
    href: "/module-4",
    label: "Module 4",
    description: "Content and scope for this module will be provided at a later stage.",
    status: "construction",
  },
];
