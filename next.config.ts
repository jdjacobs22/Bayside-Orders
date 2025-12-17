import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
    // The error suggests this is needed when middleware intercepts large requests
    // defaulting to 10MB? We match the action limit.
    // Note: If this key is invalid in newer Next versions, we might need another approach,
    // but the error message explicitly recommended it.
    middlewareClientMaxBodySize: "50mb",
  },
};

export default nextConfig;
