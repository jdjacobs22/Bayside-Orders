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
import { LogIn } from "lucide-react";

function LandingPageContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const { data: session } = authClient.useSession();

  // Clear form fields on mount, especially after sign-out
  useEffect(() => {
    const isSignOut = searchParams.get("signout") === "true";

    // Clear state
    setEmail("");
    setPassword("");

    // Clear input values directly to override browser autofill
    const clearInputs = () => {
      if (emailInputRef.current) {
        emailInputRef.current.value = "";
      }
      if (passwordInputRef.current) {
        passwordInputRef.current.value = "";
      }
    };

    // Clear immediately and multiple times to override browser autofill
    clearInputs();
    const timeout1 = setTimeout(clearInputs, 50);
    const timeout2 = setTimeout(clearInputs, 200);
    const timeout3 = setTimeout(clearInputs, 500);

    // Remove signout query parameter from URL without reload
    if (isSignOut) {
      router.replace("/", { scroll: false });
    }

    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
      clearTimeout(timeout3);
    };
  }, [searchParams, router]);

  useEffect(() => {
    if (session) {
      if ((session.user as any).role === "admin") {
        router.push("/admin");
      } else {
        router.push("/captain");
      }
    }
  }, [session, router]);

  const handleSignIn = async () => {
    console.log("Attempting sign in with", email);
    console.log(
      "Current origin:",
      typeof window !== "undefined" ? window.location.origin : "server"
    );
    try {
      const result = await authClient.signIn.email({
        email,
        password,
      });

      console.log("Sign-in result:", result);

      // Check for errors in the result
      if (result?.error) {
        console.error("Sign-in error:", result.error);
        alert("Login Failed: " + result.error.message);
        return;
      }

      // Sign-in successful - get user role from result or use a default redirect
      const user = result?.data?.user as any;
      const userRole = user?.role;

      console.log("Sign-in successful, user role:", userRole);

      // Use window.location.href to force full page reload with new session cookie
      // This ensures the middleware can properly read the session
      if (userRole === "admin") {
        window.location.href = "/admin";
      } else if (userRole === "captain") {
        window.location.href = "/captain";
      } else {
        // Fallback: redirect to captain by default, middleware will handle role check
        window.location.href = "/captain";
      }
    } catch (err: any) {
      console.error("Unexpected error in signIn", err);
      // Check if error has a message property (better-auth may throw errors)
      const errorMessage =
        err?.error?.message || err?.message || "Please try again";
      alert("Login Failed: " + errorMessage);
    }
  };

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
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                ref={emailInputRef}
                id="email"
                name="email"
                type="email"
                required
                autoComplete="off"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                ref={passwordInputRef}
                id="password"
                name="password"
                type="password"
                required
                autoComplete="off"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="h-11"
              />
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

export default function LandingPage() {
  return (
    <Suspense fallback={
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
    }>
      <LandingPageContent />
    </Suspense>
  );
}
