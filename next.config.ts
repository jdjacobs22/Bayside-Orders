import type { NextConfig } from "next";

/**
 * Next.js Configuration Object.
 * Configures experimental features, build optimizations, and environment-specific settings.
 */
const nextConfig: NextConfig = {
  /**
   * Experimental features configuration.
   */
  experimental: {
    /**
     * Server Actions configuration.
     */
    serverActions: {
      /**
       * Increases the maximum body size for Server Actions to allow for large file uploads (e.g., photo receipts).
       */
      bodySizeLimit: "50mb",
    },
    /**
     * Sets the maximum body size for proxy/middleware intercepted requests.
     * Matches the serverActions bodySizeLimit to ensure consistency across the application.
     */
    proxyClientMaxBodySize: "50mb",
  },
  /**
   * Turbopack specific configuration.
   */
  // @ts-ignore - The types might not be updated yet for this specific config
  turbopack: {
    /**
     * Explicitly sets the root to the current project directory.
     * This helps resolve package discovery issues and "Next.js package not found" errors in certain workspace environments.
     */
     root: process.cwd(),
  },
};

export default nextConfig;
