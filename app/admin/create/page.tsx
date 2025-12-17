"use client";

import Link from "next/link";
import WorkOrderForm from "@/components/WorkOrderForm";

export default function AdminCreateOrder() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="mb-6">
        <Link href="/admin" className="text-blue-600 hover:underline">
          &larr; Dashboard
        </Link>
        <h1 className="text-2xl font-bold mt-2">Create New Work Order</h1>
      </div>
      <div className="bg-white p-6 rounded shadow">
        <WorkOrderForm mode="admin-create" />
      </div>
    </div>
  );
}
