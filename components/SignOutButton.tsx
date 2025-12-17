"use client";

import { authClient } from "@/lib/auth-client";
import { useState } from "react";

export default function SignOutButton() {
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      // Manually clear all cookies FIRST to prevent session from persisting
      const clearAllCookies = () => {
        // Get all cookies
        const cookies = document.cookie.split(";");
        cookies.forEach((c) => {
          const cookieName = c.split("=")[0].trim();
          // Clear any cookie with better-auth prefix or auth-related names
          if (
            cookieName.includes("better-auth") ||
            cookieName.includes("auth") ||
            cookieName.includes("session")
          ) {
            // Try multiple clearing strategies to ensure deletion
            const expires = "Thu, 01 Jan 1970 00:00:00 UTC";
            document.cookie = `${cookieName}=; expires=${expires}; path=/; SameSite=Lax`;
            document.cookie = `${cookieName}=; expires=${expires}; path=/; domain=${window.location.hostname}; SameSite=Lax`;
            if (window.location.hostname !== "localhost") {
              document.cookie = `${cookieName}=; expires=${expires}; path=/; domain=.${window.location.hostname}; SameSite=Lax`;
            }
          }
        });
      };

      // Clear cookies immediately
      clearAllCookies();

      // Call signOut API to clear server-side session
      await authClient.signOut();

      // Clear cookies again after signOut to catch any that were reset
      clearAllCookies();

      // Clear any localStorage/sessionStorage that might contain session data
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (storageError) {
        // Ignore storage errors (might not be available)
        console.log("Storage clear error (non-fatal):", storageError);
      }

      // Longer delay to ensure server processes sign-out and cookies are cleared
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Force a hard redirect to sign-in page using replace (no history)
      // This prevents the landing page useEffect from redirecting back
      window.location.replace("/");
    } catch (e: any) {
      console.error("Sign out error", e);
      // Even on error, clear everything aggressively and redirect
      document.cookie.split(";").forEach((c) => {
        const cookieName = c.split("=")[0].trim();
        if (
          cookieName.includes("better-auth") ||
          cookieName.includes("auth") ||
          cookieName.includes("session")
        ) {
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax`;
        }
      });
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (storageError) {
        // Ignore
      }
      // Force redirect even on error - use replace to prevent back navigation
      window.location.replace("/");
    }
  };

  return (
    <button
      onClick={handleSignOut}
      disabled={isSigningOut}
      className={`bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded ${isSigningOut ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      {isSigningOut ? "Signing Out..." : "Sign Out"}
    </button>
  );
}
