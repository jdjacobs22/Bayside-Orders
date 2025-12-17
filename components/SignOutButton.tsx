"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignOutButton() {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
        await authClient.signOut({
            fetchOptions: {
                onSuccess: () => {
                    window.location.href = "/"; 
                },
                onError: (ctx) => {
                    console.error("Sign Out Error:", ctx.error.message);
                }
            },
        });
    } catch (e: any) {
        console.error("Sign out error", e);
        window.location.href = "/";
    } finally {
        setTimeout(() => {
             window.location.href = "/";
        }, 3000);
    }
  };

  return (
    <button
      onClick={handleSignOut}
      disabled={isSigningOut}
      className={`bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded ${isSigningOut ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {isSigningOut ? "Signing Out..." : "Sign Out"}
    </button>
  );
}
