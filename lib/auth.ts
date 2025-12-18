import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "@/lib/db";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
      },
    },
  },
  trustedOrigins: (() => {
    const origins: string[] = [
      "http://localhost:3000",
      "http://localhost:8765", // Local development on port 8765
      "http://10.0.0.10:8765", // Local server address
      // Add specific Vercel deployment URL
      "https://bayside-orders-srfn16hpk-jim-jacobshomecs-projects.vercel.app",
    ];

    // Cloudflare tunnel URL
    if (process.env.CLOUDFLARE_TUNNEL_URL) {
      const url = process.env.CLOUDFLARE_TUNNEL_URL.replace(/\/$/, "");
      origins.push(url);
    }

    // Vercel URLs - handle multiple formats and environments
    // VERCEL_URL is provided by Vercel (hostname only, no protocol)
    if (process.env.VERCEL_URL) {
      const vercelHost = process.env.VERCEL_URL.replace(
        /^https?:\/\//,
        ""
      ).replace(/\/$/, "");
      origins.push(`https://${vercelHost}`);
    }

    // Vercel deployment URL (alternative env var)
    if (process.env.VERCEL) {
      // VERCEL=1 is set, use VERCEL_URL if available
      if (process.env.VERCEL_URL) {
        const vercelHost = process.env.VERCEL_URL.replace(
          /^https?:\/\//,
          ""
        ).replace(/\/$/, "");
        origins.push(`https://${vercelHost}`);
      }
    }

    // Production URL if set (for custom domains or production deployments)
    if (process.env.VERCEL_PROD_URL) {
      const url = process.env.VERCEL_PROD_URL.replace(/\/$/, "");
      origins.push(url.startsWith("http") ? url : `https://${url}`);
    }

    // Support for any custom production domain
    if (process.env.PRODUCTION_URL) {
      const url = process.env.PRODUCTION_URL.replace(/\/$/, "");
      origins.push(url.startsWith("http") ? url : `https://${url}`);
    }

    // Log origins for debugging
    console.log("Better-auth trusted origins:", origins);
    console.log("VERCEL_URL env var:", process.env.VERCEL_URL);
    console.log("VERCEL env var:", process.env.VERCEL);
    console.log("NODE_ENV:", process.env.NODE_ENV);

    return origins;
  })(),
  advanced: {
    cookiePrefix: "better-auth",
    generateId: undefined, // Use default
  },
  // Add other plugins or providers here as needed
});
