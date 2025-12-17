"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { uploadPhotoToR2 } from "@/lib/r2-client";

// ... existing createWorkOrder ...
// We can keep createWorkOrder for "saving" a new order if we want to support both flows,
// OR createWorkOrder becomes "updateWorkOrder" effectively if we always start with draft.
// But the user might want a "Save" button that conceptually "creates" it if they fill it out.
// However, with Draft flow, we likely just UPDATE data into the existing ID.
// So createWorkOrder might become obsolete or handle the first Save.
// Let's add createDraft and keep createWorkOrder for now unless we refactor completely.

export async function createDraftWorkOrder() {
  try {
    const order = await prisma.workOrder.create({
      data: {
        // All fields optional or default
      },
    });
    return { success: true, data: order };
  } catch (error: any) {
    console.error("Error creating draft:", error);
    return { success: false, error: error.message };
  }
}

export async function createWorkOrder(data: any) {
  // ...
  try {
    const order = await prisma.workOrder.create({
      data: {
        nombre: data.nombre,
        fecha: new Date(data.fecha),
        horaSalida: data.horaSalida,
        destino: data.destino,
        puntoEncuentro: data.puntoEncuentro,
        pasajeros: Math.floor(Number(data.pasajeros)),
        detallesNotas: data.detallesNotas,
        combustible: Number(data.combustibleCost) || 0,
        hielo: Number(data.hieloCost) || 0,
        aguaBebidas: Number(data.aguaBebidasCost) || 0,
        gastoVarios: Number(data.gastoVariosCost) || 0,
        pagoCapitana: Number(data.pagoCapitana) || 0,
        pagoMarinero: Number(data.pagoMarinero) || 0,
        precioAcordado: Number(data.precioAcordado) || 0,
        horasAcordadas: Number(data.horasAcordadas) || 0,
        costoTotal: Number(data.costoTotal),
        deposito: Number(data.deposito),
        saldoCliente: Number(data.saldoCliente),
      },
    });
    revalidatePath("/admin/list");
    return { success: true, data: order };
  } catch (error: any) {
    console.error("Error creating order:", error);
    return { success: false, error: error.message };
  }
}

export async function getWorkOrders() {
  try {
    const orders = await prisma.workOrder.findMany({
      orderBy: { id: "desc" },
      take: 100, // Limit for now
    });
    return { success: true, data: orders };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function getWorkOrder(id: number) {
  try {
    // Validate that id is a valid number
    if (!id || isNaN(id) || !Number.isInteger(id)) {
      return { success: false, error: "ID de orden inválido" };
    }

    const order = await prisma.workOrder.findUnique({
      where: { id },
      include: { receipts: true },
    });
    if (!order) return { success: false, error: "Order not found" };
    return { success: true, data: order };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function updateWorkOrder(id: number, data: any) {
  try {
    // We might want to filter what fields can be updated based on role here too for security,
    // but existing plan implies Form logic + trust for now (or simple check).
    // Since we pass data generically, we trust the caller has filtered or we update what's sent.
    // Ideally we'd separate `updateCaptain` and `updateAdmin` actions.

    // Let's assume data matches schema shape roughly.
    // We need to parse dates ensuring they are valid Date objects if present.
    // Explicitly map fields to match schema, similar to createWorkOrder
    // This prevents passing UI-only fields like 'combustibleCost' to Prisma which causes errors.
    const updatePayload: any = {
      nombre: data.nombre,
      fecha:
        data.fecha && typeof data.fecha === "string" && data.fecha.trim() !== ""
          ? new Date(data.fecha)
          : data.fecha === ""
            ? null
            : undefined,
      horaSalida: data.horaSalida,
      destino: data.destino,
      puntoEncuentro: data.puntoEncuentro,
      pasajeros: data.pasajeros ? Math.floor(Number(data.pasajeros)) : null,
      detallesNotas: data.detallesNotas,
      combustible: Number(data.combustibleCost) || 0,
      hielo: Number(data.hieloCost) || 0,
      aguaBebidas: Number(data.aguaBebidasCost) || 0,
      gastoVarios: Number(data.gastoVariosCost) || 0,
      pagoCapitana: Number(data.pagoCapitana) || 0,
      pagoMarinero: Number(data.pagoMarinero) || 0,
      precioAcordado: Number(data.precioAcordado) || 0,
      horasAcordadas: Number(data.horasAcordadas) || 0,
      costoTotal: Number(data.costoTotal),
      deposito: Number(data.deposito),
      saldoCliente: Number(data.saldoCliente),
    };

    // Remove undefined keys if any (though mapped above shouldn't be undefined if data has them)
    // Actually, for 'update', we might only want to update changed fields, but the form sends everything.
    // The above mapping handles "if present in data, map it".
    // Note: For optional fields like `fecha`, logic above handles empty string -> null.

    const order = await prisma.workOrder.update({
      where: { id },
      data: updatePayload,
    });

    try {
      revalidatePath(`/captain/order/${id}`);
      revalidatePath(`/admin/order/${id}`);
    } catch (err) {
      console.error("Revalidation error (non-fatal):", err);
    }

    return { success: true, data: order };
  } catch (e: any) {
    console.error("Update Order Error:", e);
    return { success: false, error: e.message };
  }
}

export async function deleteWorkOrder(id: number) {
  try {
    // Validate that id is a valid number
    if (!id || isNaN(id) || !Number.isInteger(id)) {
      return { success: false, error: "ID de orden inválido" };
    }

    // Check if order exists
    const order = await prisma.workOrder.findUnique({
      where: { id },
      include: { receipts: true },
    });

    if (!order) {
      return { success: false, error: "Order not found" };
    }

    // Delete the order (receipts will be cascade deleted due to schema onDelete: Cascade)
    await prisma.workOrder.delete({
      where: { id },
    });

    // Revalidate paths
    revalidatePath("/admin/list");
    revalidatePath(`/admin/order/${id}`);
    revalidatePath(`/captain/order/${id}`);

    console.log(`Work order ${id} deleted successfully`);
    return { success: true };
  } catch (e: any) {
    console.error("Delete Order Error:", e);
    return { success: false, error: e.message || "Failed to delete order" };
  }
}

export async function uploadReceipt(formData: FormData) {
  try {
    const file = formData.get("file") as File;
    const orderId = Number(formData.get("orderId"));
    const gastoType = formData.get("gastoType") as string | null;

    if (!file || !orderId) {
      console.error("Upload receipt: Missing file or order ID", {
        hasFile: !!file,
        orderId,
      });
      return { success: false, error: "Missing file or order ID" };
    }

    // Validate file size (50MB limit to match Next.js config)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      console.error("Upload receipt: File too large", {
        size: file.size,
        maxSize,
      });
      return {
        success: false,
        error: `File too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB`,
      };
    }

    console.log("Upload receipt: Starting upload", {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      orderId,
      gastoType,
    });

    // Upload to R2
    const uploadResult = await uploadPhotoToR2({
      file,
      workOrderId: orderId,
      gastoType: gastoType || undefined,
    });

    if (!uploadResult.success || !uploadResult.url) {
      console.error("Upload receipt: R2 upload failed", {
        error: uploadResult.error,
      });
      return {
        success: false,
        error: uploadResult.error || "Failed to upload to R2",
      };
    }

    console.log("Upload receipt: R2 upload successful", {
      url: uploadResult.url,
    });

    // Create receipt record in database
    const receipt = await prisma.receipt.create({
      data: {
        url: uploadResult.url,
        workOrderId: orderId,
        gastoType: gastoType || null,
        fileName: uploadResult.fileName || null,
        fileSize: uploadResult.fileSize || null,
        mimeType: uploadResult.mimeType || null,
      },
    });

    console.log("Upload receipt: Database record created", {
      receiptId: receipt.id,
    });

    revalidatePath(`/captain/order/${orderId}`);
    revalidatePath(`/admin/order/${orderId}`);
    return { success: true, data: receipt };
  } catch (e: any) {
    console.error("Upload receipt: Unexpected error", e);
    return {
      success: false,
      error: e.message || "An unexpected error occurred during upload",
    };
  }
}
