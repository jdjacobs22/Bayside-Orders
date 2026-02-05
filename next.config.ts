import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
    // The error suggests this is needed when middleware intercepts large requests
    // defaulting to 10MB? We match the action limit.
    // Note: If this key is explicitly disallowed in future versions, remove it.
    middlewareClientMaxBodySize: "50mb",
  },
  // Explicitly set the root to the current project directory to resolve "Next.js package not found" errors
  // This is required for Turbopack to correctly identify the workspace root
  // @ts-ignore - The types might not be updated yet for this specific config
  turbopack: {
     root: process.cwd(),
  },
};

export default nextConfig;
