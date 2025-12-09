"use client";

import WorkOrderForm from "@/components/WorkOrderForm";
import Link from "next/link";

export default function AdminCreateOrder() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="mb-6">
        <Link href="/admin" className="text-blue-600 hover:underline">&larr; Back to Dashboard</Link>
        <h1 className="text-2xl font-bold mt-2">Create New Work Order</h1>
      </div>

      <WorkOrderForm mode="admin-create" />
    </div>
  );
}
