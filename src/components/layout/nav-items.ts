export interface ModuleNavItem {
  href: string;
  label: string;
  description: string;
  status: "live" | "construction";
}

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
    description: "Predicted IRI of every 50 m block, averaged across drivers, with map, profile and drive-through views.",
    status: "live",
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
