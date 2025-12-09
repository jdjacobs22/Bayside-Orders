"use client";

import WorkOrderForm from "@/components/WorkOrderForm";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function AdminOrderView() {
  const params = useParams();
  const id = params?.id as string;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="mb-6">
         <Link href="/admin" className="text-blue-600 hover:underline">&larr; Back to Dashboard</Link>
         <h1 className="text-2xl font-bold mt-2">Edit Order #{id}</h1>
      </div>

      <div className="bg-white p-6 rounded shadow">
          <WorkOrderForm mode="admin-edit" orderId={parseInt(id)} />
      </div>
    </div>
  );
}
