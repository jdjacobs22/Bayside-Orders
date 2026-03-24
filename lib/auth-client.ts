/**
 * auth-client.ts
 * 
 * Frontend authentication client for interacting with the better-auth service.
 * Used for sign-in, sign-out, and session management in Client Components.
 */
import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";

/**
 * Shared authentication client instance.
 * Automatically resolves the base URL based on the environment.
 */
export const authClient = createAuthClient({
  baseURL: typeof window !== "undefined" ? window.location.origin : "http://localhost:3000",
  plugins: [
    adminClient()
  ]
});

/**
 * Timestamp exported to force re-renders/refresh in UI components when imported as a dependency.
 */
export const forceRefresh = Date.now();
