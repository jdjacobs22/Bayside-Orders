"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminSearchOrder() {
  const [orderId, setOrderId] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (orderId) {
        // reuse the captain view logic or create a specific admin view?
        // Plan says "View a form by order number". 
        // Admin likely wants to edit it too. 
        // We can reuse the same route structure or specific admin/order/[id].
        // Let's create admin/order/[id] for consistency.
        router.push(`/admin/order/${orderId}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="mb-6">
        <Link href="/admin" className="text-blue-600 hover:underline">&larr; Back to Dashboard</Link>
        <h1 className="text-2xl font-bold mt-2">Find Work Order</h1>
      </div>

      <div className="bg-white p-6 rounded shadow max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Order Number</label>
                <input 
                    type="number" 
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                    placeholder="Enter Order ID"
                    required
                />
            </div>
            
            <button 
                type="submit" 
                className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
            >
                Search
            </button>
        </form>
      </div>
    </div>
  );
}
