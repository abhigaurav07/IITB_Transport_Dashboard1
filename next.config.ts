import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Old addresses from before the projects restructure keep working.
  async redirects() {
    return [
      { source: "/data-collection", destination: "/projects/mumbai-pune-expressway/data-collection", permanent: false },
      { source: "/module-1/atal-setu-iri", destination: "/projects/atal-setu/module-1", permanent: false },
      { source: "/module-1/kasara-iri", destination: "/projects/kasara/module-1", permanent: false },
      { source: "/module-1", destination: "/projects", permanent: false },
      { source: "/projects/iitb-transport", destination: "/projects", permanent: false },
    ];
  },
};

export default nextConfig;
