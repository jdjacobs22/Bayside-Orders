import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "@/lib/db";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {  
    enabled: true
  },
  user: {
      additionalFields: {
          role: {
              type: "string",
          }
      }
  },
  trustedOrigins: [
    "http://localhost:3000", 
    "http://10.0.0.10:8765", // Local server address
    ...(process.env.CLOUDFLARE_TUNNEL_URL ? [process.env.CLOUDFLARE_TUNNEL_URL] : []), // Cloudflare tunnel URL (e.g., https://something.trycloudflare.com)
  ],
  advanced: {
    cookiePrefix: "better-auth",
    generateId: undefined, // Use default
  },
  // Add other plugins or providers here as needed
});
