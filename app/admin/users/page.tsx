/**
 * app/admin/users/page.tsx
 * 
 * Administrative page for displaying and managing all system users.
 * Wraps the AdminUserList component to provide a consistent page layout.
 */
"use client";

import AdminHeader from "@/components/AdminHeader";
import AdminUserList from "@/components/AdminUserList";

/**
 * UsersListPage Component
 * 
 * Renders the user management view within the admin namespace.
 */
export default function UsersListPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
      <AdminHeader title="All System Users" />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AdminUserList />
      </div>
    </div>
  );
}
