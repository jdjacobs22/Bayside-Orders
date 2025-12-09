import { auth } from "@/lib/auth"; // Make sure to import your auth instance
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
