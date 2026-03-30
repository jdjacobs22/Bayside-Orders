import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin } from "better-auth/plugins";
import prisma from "@/lib/db";

/**
 * Better-Auth Configuration
 */
export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      role: { type: "string" },
      nombre: { type: "string" },
      apellido: { type: "string" },
      cell: { type: "string" },
    },
  },
  session: {
    expiresIn: 60 * 30, // 30 minutes
    updateAge: 60 * 1, // 1 minute
    freshAge: 0,
  },
  advanced: {
    cookieOptions: {
      sameSite: "lax",
      secure: false, // For local network access
    },
  },
  // Base URL for cookies
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  
  trustedOrigins: (() => {
    const origins = [
      "http://10.0.0.17:8765", // <-- YOUR ACTIVE LOCAL IP IS HERE
      "http://10.0.0.17:3000",
      "https://workorder.jacobshomenet.casa",
      "http://localhost:3000",
      "http://localhost:8765",
      "http://127.0.0.1:3000",
    ];
    if (process.env.CLOUDFLARE_TUNNEL_URL) origins.push(process.env.CLOUDFLARE_TUNNEL_URL);
    if (process.env.VERCEL_URL) origins.push(`https://${process.env.VERCEL_URL}`);
    return [...new Set(origins.filter(Boolean))];
  })(),
  
  plugins: [
    admin()
  ]
} as any);
