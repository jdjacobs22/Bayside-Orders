"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getWorkOrders, deleteWorkOrder } from "@/app/actions/work-order";
import AdminHeader from "@/components/AdminHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";

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
      setOrders(orders.filter((order) => order.id !== orderId));
      alert("Orden eliminada exitosamente");
    } else {
      alert("Error al eliminar la orden: " + res.error);
    }
    setDeletingId(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
        <AdminHeader title="All Work Orders" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
      <AdminHeader title="All Work Orders" />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="border-0 shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-2xl font-bold">Work Orders</CardTitle>
            <Button asChild>
              <Link href="/admin/create" className="gap-2">
                <Plus className="h-4 w-4" />
                Create New
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No work orders found. Create your first order to get started.
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order #</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Captain/Boat</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">
                          <Link
                            href={`/admin/order/${order.id}`}
                            className="text-primary hover:underline"
                          >
                            #{order.id}
                          </Link>
                        </TableCell>
                        <TableCell>{order.nombre || "-"}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {order.fecha
                            ? new Date(order.fecha).toLocaleDateString()
                            : "-"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">-</TableCell>
                        <TableCell className="font-medium">
                          ${order.costoTotal?.toFixed(2) || "0.00"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                              className="h-8 w-8 p-0"
                            >
                              <Link href={`/admin/order/${order.id}`}>
                                <Pencil className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(order.id, order.nombre)}
                              disabled={deletingId === order.id}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            >
                              {deletingId === order.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
