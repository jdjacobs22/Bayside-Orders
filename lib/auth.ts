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
  trustedOrigins: [
    "http://localhost:3000",
    "http://localhost:8765", // Local development on port 8765
    "http://10.0.0.10:8765", // Local server address
    ...(process.env.CLOUDFLARE_TUNNEL_URL
      ? [process.env.CLOUDFLARE_TUNNEL_URL]
      : []), // Cloudflare tunnel URL (e.g., https://something.trycloudflare.com)
    // Vercel URLs - VERCEL_URL is automatically provided by Vercel (hostname only, no protocol)
    ...(process.env.VERCEL_URL
      ? [
          `https://${process.env.VERCEL_URL.replace(/^https?:\/\//, "").replace(/\/$/, "")}`,
        ]
      : []),
    // Production URL if set (for custom domains or production deployments)
    ...(process.env.VERCEL_PROD_URL
      ? [process.env.VERCEL_PROD_URL.replace(/\/$/, "")]
      : []),
    // Support for any custom production domain
    ...(process.env.PRODUCTION_URL
      ? [process.env.PRODUCTION_URL.replace(/\/$/, "")]
      : []),
  ],
  advanced: {
    cookiePrefix: "better-auth",
    generateId: undefined, // Use default
  },
  // Add other plugins or providers here as needed
});
