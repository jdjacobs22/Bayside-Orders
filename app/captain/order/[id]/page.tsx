"use client";

import WorkOrderForm from "@/components/WorkOrderForm-old";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function CaptainOrderView() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const orderId = parseInt(id);

  // Validate the ID
  if (!id || isNaN(orderId)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-700 mb-4">ID de orden inválido</p>
          <Link href="/captain" className="inline-block bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
            Volver
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile-friendly header */}
      <div className="bg-white p-4 shadow mb-4 flex justify-between items-center sticky top-0 z-10">
        <Link href="/captain" className="text-blue-600 font-bold">&larr; Back</Link>
        <h1 className="font-bold text-lg">Order #{id}</h1>
        <div className="w-8"></div> {/* Spacer for center alignment */}
      </div>

      <div className="pb-8">
        {/* We pass the ID and mode to the form. 
              The form component will fetch the data based on ID. 
          */}
        <WorkOrderForm mode="captain-edit" orderId={orderId} />
      </div>
    </div>
  );
}
