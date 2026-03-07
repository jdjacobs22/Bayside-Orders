"use client";

import { authClient } from "@/lib/auth-client";
import { useState } from "react";

/**
 * SignOutButton Component
 * 
 * A specialized button component that handles a comprehensive and aggressive sign-out process.
 * 
 * Sign-out Workflow:
 * 1. Manually clears all authentication-related cookies (better-auth, auth, session).
 * 2. Invokes the authClient.signOut() method to invalidate the session server-side.
 * 3. Aggressively clears localStorage and sessionStorage to remove any cached user data.
 * 4. Provides a small delay to ensure cookie/cache clearing processes finish.
 * 5. Performs a hard redirect (window.location.replace) to the root sign-in page.
 * 6. Adds a 'signout=true' query parameter to prevent the landing page from auto-redirecting back to the dashboard.
 * 
 * @returns A button styled for destructive actions (red) with loading state feedback.
 */
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
        // Set flag AFTER clearing to ensure sign-in page starts blank
        // This prevents flash of old credentials
        sessionStorage.setItem("justSignedOut", "true");
      } catch (storageError) {
        // Ignore storage errors (might not be available)
        console.log("Storage clear error (non-fatal):", storageError);
      }

      // Longer delay to ensure server processes sign-out and cookies are cleared
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Force a hard redirect to sign-in page using replace (no history)
      // Add query parameter to signal sign-out so sign-in page can clear fields
      // This prevents the landing page useEffect from redirecting back
      window.location.replace("/?signout=true");
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
        // Set flag AFTER clearing to ensure sign-in page starts blank
        sessionStorage.setItem("justSignedOut", "true");
      } catch (storageError) {
        // Ignore
      }
      // Force redirect even on error - use replace to prevent back navigation
      window.location.replace("/?signout=true");
    }
  };

  return (
    <button
      onClick={handleSignOut}
      disabled={isSigningOut}
      className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-9 px-4 bg-destructive text-destructive-foreground hover:bg-destructive/90"
    >
      {isSigningOut ? "Signing Out..." : "Sign Out"}
    </button>
  );
}
