"use client";

import { authClient } from "@/lib/auth-client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const { data: session } = authClient.useSession();

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
    try {
        await authClient.signIn.email({
            email,
            password,
            fetchOptions: {
                onSuccess: (ctx) => {
                    const user = ctx.data.user as any;
                    if (user.role === "admin") {
                        router.push("/admin");
                    } else {
                        router.push("/captain");
                    }
                    router.refresh();
                },
                onError: (ctx) => {
                    alert("Login Failed: " + ctx.error.message);
                }
            }
        });
    } catch (err: any) {
        console.error("Unexpected error in signIn", err);
        alert("Unexpected error: " + err.message);
    }
  };

  const handleSignUp = async () => {
      await authClient.signUp.email({
          email,
          password,
          name: "Test User", 
      });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-6 shadow-md">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            BAYSIDEPV Work Order
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to access the dashboard
          </p>
        </div>
        <div className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email address
            </label>
            <div className="mt-1">
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full rounded-md border-gray-300 py-2 px-3 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border"
              />
            </div>
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <div className="mt-1">
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-md border-gray-300 py-2 px-3 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border"
              />
            </div>
          </div>
          <div className="flex gap-4">
            <button
              onClick={handleSignIn}
              className="flex w-full justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Sign in
            </button>
             <button
              onClick={handleSignUp}
              className="flex w-full justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Sign Up
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
