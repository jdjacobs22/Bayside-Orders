import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin } from "better-auth/plugins";
import prisma from "@/lib/db";

/**
 * Better-Auth Configuration
 * 
 * Configures the authentication system with Prisma adapter and Admin plugin.
 * Includes a database interceptor (hook) to ensure custom fields are correctly 
 * persisted during user creation across all API entry points.
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
      role: { type: "string", required: true, input: true },
      nombre: { type: "string", required: true, input: true },
      apellido: { type: "string", required: true, input: true },
      cell: { type: "string", required: true, input: true },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user, context) => {
          // INTERCEPTOR: Ensures that custom fields provided in the request body
          // are merged into the final database creation payload, bypassing 
          // any internal library stripping.
          // Note: Better-Auth context may store input in 'body', 'params', 'input', or 'data'
          // depending on the API entry point (e.g., signUpEmail vs admin.createUser).
          const ctx = context as any;
          const body = ctx.body || ctx.params || ctx.input || ctx.data || {};
          
          console.log("[Better-Auth Hook] Detected Input Data:", JSON.stringify(body));
          console.log("[Better-Auth Hook] Incoming User Object:", JSON.stringify(user));

          // Fallback logic if nombre/apellido are missing from both body and incoming user object
          // We can try to derive them from the 'name' field which Better-Auth usually populates
          const fallbackNombre = user.name?.split(" ")[0] || "";
          const fallbackApellido = user.name?.split(" ").slice(1).join(" ") || "";

          // Ensure we don't return undefined for required fields to avoid Prisma validation errors
          const result = {
            data: {
              ...user,
              nombre: body.nombre || (user as any).nombre || fallbackNombre,
              apellido: body.apellido || (user as any).apellido || fallbackApellido,
              cell: body.cell || (user as any).cell || "",
              role: body.role || (user as any).role || "user",
            },
          };
          console.log("[Better-Auth Hook] Final Merged User:", JSON.stringify(result.data));
          return result;
        },
      },
    },
  },
  session: {
    expiresIn: 60 * 30, // 30 minutes
    updateAge: 60 * 1, // 1 minute
    freshAge: 0,
  },
  advanced: {
    useSecureCookies: false, // For local network access
  },
  // Base URL for cookies
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  
  trustedOrigins: (() => {
    const origins: string[] = [
      "http://10.0.0.17:8765",
      "http://10.0.0.17:3000",
      "https://workorder.jacobshomenet.casa",
      "http://localhost:3000",
      "http://localhost:8765",
      "http://127.0.0.1:3000",
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
});
