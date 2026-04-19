/**
 * app/page.tsx
 * 
 * The entry point of the application.
 * Renders the landing page with authentication logic (Sign In).
 * Automatically redirects authenticated users to their respective dashboards (Admin or Captain).
 */
"use client";

import { authClient } from "@/lib/auth-client";
import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { LogIn, Eye, EyeOff } from "lucide-react";

/**
 * LandingPageContent helper component.
 * Handles the login form, password visibility toggling, and aggressive clearing 
 * of browser autofill data after sign-out.
 * Wraps the stateful logic that requires the 'router' and 'searchParams'.
 */
function LandingPageContent() {
  const [isHidingForSignOut, setIsHidingForSignOut] = useState(false);
  const [formKey, setFormKey] = useState("default");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const { data: session, isPending } = authClient.useSession();

  // Initialized at component creation (before any effects) so it survives the
  // router.replace("/") re-render that wipes the URL param and sessionStorage flag.
  // Stays true for the lifetime of this component instance; resets on full navigation.
  const justSignedOutRef = useRef(
    typeof window !== "undefined" &&
      (sessionStorage.getItem("justSignedOut") === "true" ||
        new URLSearchParams(window.location.search).get("signout") === "true")
  );

  // Clear form fields on mount, especially after sign-out
  useEffect(() => {
    const isSignOut = searchParams.get("signout") === "true";
    const justSignedOut =
      typeof window !== "undefined" &&
      sessionStorage.getItem("justSignedOut") === "true";

    // Keep ref in sync — covers the case where only the URL param fires this effect
    if (isSignOut || justSignedOut) {
      justSignedOutRef.current = true;
    }

    // If we just signed out, trigger the "Gate" to prevent autofill flash
    if (justSignedOut) {
      setIsHidingForSignOut(true);
      setFormKey(Date.now().toString());
      sessionStorage.removeItem("justSignedOut");

      // Hide inputs for 100ms to allow browser autofill to fail gracefully
      const hideTimeout = setTimeout(() => {
        setIsHidingForSignOut(false);
      }, 100);

      return () => clearTimeout(hideTimeout);
    }

    // Clear state immediately
    setEmail("");
    setPassword("");

    // Clear input values directly to override browser autofill
    const clearInputs = () => {
      if (emailInputRef.current) {
        emailInputRef.current.value = "";
        // Force clear by setting value multiple times
        emailInputRef.current.setAttribute("value", "");
      }
      if (passwordInputRef.current) {
        passwordInputRef.current.value = "";
        passwordInputRef.current.setAttribute("value", "");
      }
    };

    // Clear immediately and multiple times to override browser autofill
    clearInputs();
    const timeout1 = setTimeout(clearInputs, 0);
    const timeout2 = setTimeout(clearInputs, 50);
    const timeout3 = setTimeout(clearInputs, 200);
    const timeout4 = setTimeout(clearInputs, 500);

    // Remove signout query parameter from URL without reload
    if (isSignOut) {
      router.replace("/", { scroll: false });
    }

    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
      clearTimeout(timeout3);
      clearTimeout(timeout4);
    };
  }, [searchParams, router]);

  useEffect(() => {
    // Don't auto-redirect if we just signed out — the session cookie may still be
    // technically valid (HttpOnly cookies can't be cleared from JS), but the user
    // explicitly signed out and should stay on the login page.
    if (!session || justSignedOutRef.current) return;

    console.log("Active session detected on landing page:", session.user?.email, (session.user as any)?.role);
    const role = (session.user as any).role;
    if (role === "admin" || role === "representante") {
      router.push("/admin");
    } else {
      router.push("/captain");
    }
  }, [session, router]);

  const handleSignIn = async () => {
    if (isPending || (session && !justSignedOutRef.current)) return; // Prevent double sign-in, but allow re-sign-in after sign-out

    console.log("Attempting sign in with", email);
    try {
      const result = await authClient.signIn.email({
        email,
        password,
      });

      console.log("Sign-in result:", result);

      if (result?.error) {
        console.error("Sign-in error:", result.error);
        alert("Login Failed: " + result.error.message);
        return;
      }

      // Clear sign-out guard so auto-redirect works if navigation loops back to "/"
      justSignedOutRef.current = false;

      const user = result?.data?.user as any;
      const userRole = user?.role;

      if (userRole === "admin" || userRole === "representante") {
        window.location.href = "/admin";
      } else {
        window.location.href = "/captain";
      }
    } catch (err: any) {
      // Ignore AbortError which happens when the user is being redirected
      if (err.name === 'AbortError' || err.message?.includes('fetch')) {
        console.log("Sign-in fetch aborted or network error during redirect - ignoring alert");
        return;
      }
      console.error("Unexpected error in signIn", err);
      const errorMessage = err?.error?.message || err?.message || "Please try again";
      alert("Login Failed: " + errorMessage);
    }
  };

  if (isPending || (session && !isHidingForSignOut && !justSignedOutRef.current)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-slate-600 font-medium">Validando sesión...</p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await handleSignIn();
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-4">
      <Card className="w-full max-w-md shadow-xl border-0 bg-white/95 backdrop-blur">
        <CardHeader className="space-y-1 text-center pb-6">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <LogIn className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            BAYSIDE PV
          </CardTitle>
          <CardDescription className="text-base mt-2">
            Work Order Management System
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form key={formKey} onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                key={`email-${formKey}`}
                ref={emailInputRef}
                id={isHidingForSignOut ? "hidden-email" : "email"}
                name={isHidingForSignOut ? `email-${formKey}` : "email"}
                type="email"
                required
                autoComplete="new-password"
                value={isHidingForSignOut ? "" : email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSignIn();
                  }
                }}
                className={`h-11 ${isHidingForSignOut ? "opacity-0 invisible" : ""}`}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  key={`password-${formKey}`}
                  ref={passwordInputRef}
                  id={isHidingForSignOut ? "hidden-password" : "password"}
                  name={isHidingForSignOut ? `password-${formKey}` : "password"}
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  value={isHidingForSignOut ? "" : password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSignIn();
                    }
                  }}
                  placeholder="Enter your password"
                  className={`h-11 pr-10 ${isHidingForSignOut ? "opacity-0 invisible" : ""}`}
                />
                {!isHidingForSignOut && (
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                )}
              </div>
            </div>
            <Button
              type="submit"
              className="w-full h-11 text-base font-semibold mt-6"
              size="lg"
            >
              <LogIn className="mr-2 h-4 w-4" />
              Sign In
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Main LandingPage component.
 * Uses React Suspense to handle the useSearchParams() hook, which can trigger
 * static generation warnings if not wrapped in a Suspense boundary.
 * 
 * @returns The rendered landing page with a sign-in card.
 */
export default function LandingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-4">
          <Card className="w-full max-w-md shadow-xl border-0 bg-white/95 backdrop-blur">
            <CardHeader className="space-y-1 text-center pb-6">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <LogIn className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                BAYSIDE PV
              </CardTitle>
              <CardDescription className="text-base mt-2">
                Work Order Management System
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="h-11 bg-gray-100 rounded animate-pulse"></div>
                <div className="h-11 bg-gray-100 rounded animate-pulse"></div>
                <div className="h-11 bg-gray-100 rounded animate-pulse"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      }
    >
      <LandingPageContent />
    </Suspense>
  );
}
