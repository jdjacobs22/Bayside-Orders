"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AdminHeader from "@/components/AdminHeader";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Search, Loader2, AlertCircle } from "lucide-react";
import { getWorkOrder } from "@/app/actions/work-order";

export default function AdminSearchOrder() {
  const [orderId, setOrderId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!orderId) {
      return;
    }

    const orderIdNum = parseInt(orderId);
    if (isNaN(orderIdNum)) {
      setError("Please enter a valid order number");
      return;
    }

    setLoading(true);
    try {
      const result = await getWorkOrder(orderIdNum);

      if (result.success && result.data) {
        // Order exists, redirect to edit page
        router.push(`/admin/order/${orderIdNum}`);
      } else {
        // Order not found, show error and stay on search form
        setError(
          `Order #${orderIdNum} not found. Please check the order number and try again.`
        );
        setOrderId(""); // Clear the input field
      }
    } catch (err: any) {
      setError(
        "An error occurred while searching for the order. Please try again."
      );
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
      <AdminHeader title="Find Work Order" />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 flex items-center justify-center">
        <Card className="w-full max-w-md shadow-xl border-0">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              Search Order
            </CardTitle>
            <CardDescription className="text-center">
              Enter an order number to view its details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="orderId">Order Number</Label>
                <Input
                  id="orderId"
                  type="number"
                  value={orderId}
                  onChange={(e) => {
                    setOrderId(e.target.value);
                    setError(null); // Clear error when user types
                  }}
                  placeholder="Enter Order ID"
                  required
                  className="h-11"
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-11"
                size="lg"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Search
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
