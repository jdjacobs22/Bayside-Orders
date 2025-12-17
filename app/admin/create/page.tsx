"use client";

import WorkOrderForm from "@/components/WorkOrderForm";
import AdminHeader from "@/components/AdminHeader";
import { Card } from "@/components/ui/card";

export default function AdminCreateOrder() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
      <AdminHeader title="Create New Work Order" />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="border-0 shadow-xl">
          <WorkOrderForm mode="admin-create" />
        </Card>
      </div>
    </div>
  );
}
