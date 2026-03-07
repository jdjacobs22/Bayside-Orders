/**
 * Catch-all API route for better-auth.
 * 
 * This file maps all authentication-related HTTP requests (GET and POST)
 * to the better-auth handler, enabling features like sign-in, session verification, 
 * and user management via the shared 'auth' instance.
 */
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
