"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getWorkOrders } from "@/app/actions/work-order";

export default function AdminOrderList() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="mb-6 flex justify-between">
        <div>
            <Link href="/admin" className="text-blue-600 hover:underline">&larr; Dashboard</Link>
            <h1 className="text-2xl font-bold mt-2">All Work Orders</h1>
        </div>
        <Link href="/admin/create" className="bg-blue-600 text-white px-4 py-2 rounded">Create New</Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order #</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Captain/Boat</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                    {/* Link to view/edit if we had that page, for now just list */}
                    {order.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.nombre}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(order.fecha).toLocaleDateString()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{/* Placeholder if we had captain name */} - </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${order.costoTotal}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
