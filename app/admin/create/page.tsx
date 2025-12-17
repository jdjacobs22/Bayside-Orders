"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createDraftWorkOrder } from "@/app/actions/work-order";

export default function AdminCreateOrder() {
  const router = useRouter();

  useEffect(() => {
     const init = async () => {
         const res = await createDraftWorkOrder();
         if (res.success && res.data) {
             router.replace(`/admin/order/${res.data.id}`);
         } else {
             alert("Error initializing order: " + res.error);
         }
     };
     init();
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl font-bold text-gray-600 flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            Initializing New Order...
        </div>
    </div>
  );
}
