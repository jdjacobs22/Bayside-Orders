/**
 * app/admin/users/page.tsx
 * 
 * Administrative page for displaying and managing all system users.
 * Wraps the AdminUserList component to provide a consistent page layout.
 */
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import AdminHeader from "@/components/AdminHeader";
import AdminUserList from "@/components/AdminUserList";

/**
 * UsersListPage Component
 * 
 * Renders the user management view within the admin namespace.
 */
export default function UsersListPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (!isPending && session && session.user?.role !== "admin") {
      router.push("/admin");
    }
  }, [session, isPending, router]);
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
      <AdminHeader title="All System Users" />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AdminUserList />
      </div>
    </div>
  );
}
