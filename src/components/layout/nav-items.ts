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
    description: "Daily chainage-wise survey progress tracker.",
    status: "live",
  },
  {
    href: "/data-processing",
    label: "Data Processing",
    description: "Cleaning, validation and QA of raw field data.",
    status: "construction",
  },
  {
    href: "/data-analysis",
    label: "Data Analysis",
    description: "Volume, speed, density and capacity analysis.",
    status: "construction",
  },
  {
    href: "/traffic-modeling",
    label: "Traffic Modeling",
    description: "Simulation, calibration and forecasting models.",
    status: "construction",
  },
  {
    href: "/results-reporting",
    label: "Results & Reporting",
    description: "LOS assessment, final outputs and reports.",
    status: "construction",
  },
];
