"use client";

import WorkOrderForm from "@/components/WorkOrderForm";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { deleteWorkOrder } from "@/app/actions/work-order";

export default function AdminOrderView() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const orderId = parseInt(id);
  const [deleting, setDeleting] = useState(false);

  // Validate the ID
  if (!id || isNaN(orderId)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-700 mb-4">ID de orden inválido</p>
          <Link
            href="/admin/list"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            Volver a la lista
          </Link>
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
      <div className="bg-white p-4 shadow mb-4">
        <div className="flex justify-between items-start">
          <div>
            <Link href="/admin/list" className="text-blue-600 font-bold">
              &larr; Back to List
            </Link>
            <h1 className="text-2xl font-bold mt-2">Edit Order #{orderId}</h1>
          </div>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {deleting ? "Deleting..." : "Delete Order"}
          </button>
        </div>
      </div>
      <div className="bg-white p-6 rounded shadow mx-4">
        <WorkOrderForm mode="admin-edit" orderId={orderId} />
      </div>
    </div>
  );
}
