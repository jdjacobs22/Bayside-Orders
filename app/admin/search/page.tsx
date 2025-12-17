"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AdminHeader from "@/components/AdminHeader";

export default function AdminSearchOrder() {
  const [orderId, setOrderId] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (orderId) {
        router.push(`/admin/order/${orderId}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminHeader title="Find Work Order" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

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
    </div>
  );
}
