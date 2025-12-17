"use client";

import Link from "next/link";
import AdminHeader from "@/components/AdminHeader";

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-gray-100">
      <AdminHeader title="Admin Dashboard" showBackButton={false} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Create Order */}
          <Link
            href="/admin/create"
            className="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition cursor-pointer border-t-4 border-blue-500"
          >
            <h2 className="text-xl font-semibold mb-2 text-blue-800">
              Create Work Order
            </h2>
            <p className="text-gray-600">
              Create a new work order with full administrative control.
            </p>
          </Link>

          {/* Card 2: List Orders */}
          <Link
            href="/admin/list"
            className="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition cursor-pointer border-t-4 border-green-500"
          >
            <h2 className="text-xl font-semibold mb-2 text-green-800">
              List All Orders
            </h2>
            <p className="text-gray-600">
              View and manage all active and past work orders.
            </p>
          </Link>

          {/* Card 3: Find Order */}
          <Link
            href="/admin/search"
            className="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition cursor-pointer border-t-4 border-purple-500"
          >
            <h2 className="text-xl font-semibold mb-2 text-purple-800">
              Find Order by #
            </h2>
            <p className="text-gray-600">
              Quickly lookup a specific work order by its unique ID.
            </p>
          </Link>

          {/* Card 4: Add User */}
          <Link
            href="/admin/add-user"
            className="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition cursor-pointer border-t-4 border-purple-500"
          >
            <h2 className="text-xl font-semibold mb-2 text-purple-800">
              Add User
            </h2>
            <p className="text-gray-600">Add a new user to the system.</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
