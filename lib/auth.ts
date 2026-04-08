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
      nombre: { type: "string", input: true },
      apellido: { type: "string", input: true },
      cell: { type: "string", input: true },
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
    const origins: string[] = [
      "http://10.0.0.17:8765", // <-- YOUR ACTIVE LOCAL IP IS HERE
      "http://10.0.0.17:3000",
      "https://workorder.jacobshomenet.casa",
      "http://localhost:3000",
      "http://localhost:8765",
      "http://127.0.0.1:3000",
      "https://bayside-orders.vercel.app",
      // Production Vercel project URL (VERCEL_URL is often a *deployment* host, not this alias)
      "https://bayside-orders.vercel.app",
    ];
    const pushOrigin = (value: string | undefined) => {
      if (!value?.trim()) return;
      const trimmed = value.replace(/\/$/, "");
      try {
        if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
          origins.push(new URL(trimmed).origin);
        } else {
          origins.push(new URL(`https://${trimmed}`).origin);
        }
      } catch {
        origins.push(trimmed);
      }
    };
    if (process.env.BETTER_AUTH_URL) pushOrigin(process.env.BETTER_AUTH_URL);
    if (process.env.NEXT_PUBLIC_APP_URL) pushOrigin(process.env.NEXT_PUBLIC_APP_URL);
    if (process.env.TRUSTED_ORIGINS) {
      for (const part of process.env.TRUSTED_ORIGINS.split(",")) {
        pushOrigin(part.trim());
      }
    }
    if (process.env.CLOUDFLARE_TUNNEL_URL) pushOrigin(process.env.CLOUDFLARE_TUNNEL_URL);
    if (process.env.VERCEL_URL) pushOrigin(process.env.VERCEL_URL);
    return [...new Set(origins.filter(Boolean))];
  })(),
  
  plugins: [
    admin()
  ]
} as any);
