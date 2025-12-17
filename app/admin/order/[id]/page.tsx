"use client";

import WorkOrderForm from "@/components/WorkOrderForm";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { deleteWorkOrder } from "@/app/actions/work-order";
import AdminHeader from "@/components/AdminHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trash2, Loader2 } from "lucide-react";

export default function AdminOrderView() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const orderId = parseInt(id);
  const [deleting, setDeleting] = useState(false);

  // Validate the ID
  if (!id || isNaN(orderId)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
        <AdminHeader
          title="Error"
          backHref="/admin/list"
          backLabel="Back to List"
        />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="border-0 shadow-xl">
            <div className="p-8 text-center">
              <h1 className="text-2xl font-bold text-destructive mb-4">
                Error
              </h1>
              <p className="text-muted-foreground mb-4">ID de orden inválido</p>
            </div>
          </Card>
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
    try {
      const res = await deleteWorkOrder(orderId);

      if (res.success) {
        alert("Orden eliminada exitosamente");
        // Reset deleting state before navigation to prevent UI lock if navigation fails
        setDeleting(false);
        router.push("/admin/list");
      } else {
        alert("Error al eliminar la orden: " + res.error);
        setDeleting(false);
      }
    } catch (error) {
      // Handle unexpected errors
      console.error("Unexpected error deleting order:", error);
      alert("Error inesperado al eliminar la orden");
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
      <AdminHeader
        title={`Edit Order #${orderId}`}
        backHref="/admin/list"
        backLabel="Back to List"
        showBackButton={true}
        rightActions={
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Order
              </>
            )}
          </Button>
        }
      />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="border-0 shadow-xl">
          <WorkOrderForm mode="admin-edit" orderId={orderId} />
        </Card>
      </div>
    </div>
  );
}
