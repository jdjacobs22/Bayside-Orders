"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getWorkOrders, deleteWorkOrder } from "@/app/actions/work-order";

export default function AdminOrderList() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    async function fetchOrders() {
      const res = await getWorkOrders();
      if (res.success && res.data) {
        setOrders(res.data);
      }
      setLoading(false);
    }
    fetchOrders();
  }, []);

  const handleDelete = async (orderId: number, orderName: string) => {
    if (
      !confirm(
        `¿Estás seguro de que deseas eliminar la orden #${orderId}${orderName ? ` (${orderName})` : ""}? Esta acción no se puede deshacer.`
      )
    ) {
      return;
    }

    setDeletingId(orderId);
    const res = await deleteWorkOrder(orderId);

    if (res.success) {
      // Remove from local state
      setOrders(orders.filter((order) => order.id !== orderId));
      alert("Orden eliminada exitosamente");
    } else {
      alert("Error al eliminar la orden: " + res.error);
    }
    setDeletingId(null);
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="mb-6 flex justify-between">
        <div>
          <Link href="/admin" className="text-blue-600 hover:underline">
            &larr; Dashboard
          </Link>
          <h1 className="text-2xl font-bold mt-2">All Work Orders</h1>
        </div>
        <Link
          href="/admin/create"
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Create New
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Order #
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Captain/Boat
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                  <Link
                    href={`/admin/order/${order.id}`}
                    className="hover:underline"
                  >
                    {order.id}
                  </Link>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {order.nombre || "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {order.fecha
                    ? new Date(order.fecha).toLocaleDateString()
                    : "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  -
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ${order.costoTotal?.toFixed(2) || "0.00"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex gap-2">
                    <Link
                      href={`/admin/order/${order.id}`}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(order.id, order.nombre)}
                      disabled={deletingId === order.id}
                      className="text-red-600 hover:text-red-900 disabled:text-gray-400 disabled:cursor-not-allowed"
                    >
                      {deletingId === order.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
