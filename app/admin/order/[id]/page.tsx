"use client";

import WorkOrderForm from "@/components/WorkOrderForm";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { deleteWorkOrder } from "@/app/actions/work-order";
import AdminHeader from "@/components/AdminHeader";

export default function AdminOrderView() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const orderId = parseInt(id);
  const [deleting, setDeleting] = useState(false);

  // Validate the ID
  if (!id || isNaN(orderId)) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminHeader title="Error" backHref="/admin/list" backLabel="Back to List" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
            <p className="text-gray-700 mb-4">ID de orden inválido</p>
          </div>
        </div>
      </div>
    );
  }

  const handleDelete = async () => {
    if (
      !confirm(
        `¿Estás seguro de que deseas eliminar la orden #${orderId}? Esta acción no se puede deshacer.`
      )
    ) {
      return;
    }

    setDeleting(true);
    const res = await deleteWorkOrder(orderId);

    if (res.success) {
      alert("Orden eliminada exitosamente");
      router.push("/admin/list");
    } else {
      alert("Error al eliminar la orden: " + res.error);
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader
        title={`Edit Order #${orderId}`}
        backHref="/admin/list"
        backLabel="Back to List"
        showBackButton={true}
        rightActions={
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {deleting ? "Deleting..." : "Delete Order"}
          </button>
        }
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white p-6 rounded shadow">
          <WorkOrderForm mode="admin-edit" orderId={orderId} />
        </div>
      </div>
    </div>
  );
}
