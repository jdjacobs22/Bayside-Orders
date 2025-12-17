"use client";

import WorkOrderForm from "@/components/WorkOrderForm";
import AdminHeader from "@/components/AdminHeader";

export default function AdminCreateOrder() {
  return (
    <div className="min-h-screen bg-gray-100">
      <AdminHeader title="Create New Work Order" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white p-6 rounded shadow">
          <WorkOrderForm mode="admin-create" />
        </div>
      </div>
    </div>
  );
}
