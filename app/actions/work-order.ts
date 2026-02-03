"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { Prisma } from "@/lib/prisma-client/client";
import { uploadPhotoToR2 } from "@/lib/r2-client";
import { getAdminSchema, getCaptainSchema } from "@/lib/schemas";

function parseDateDMY(dateStr: string | null | undefined): Date | undefined {
  if (!dateStr || typeof dateStr !== "string") return undefined;
  const parts = dateStr.split("/");
  if (parts.length !== 3) return undefined;
  const [day, month, year] = parts.map(Number);
  if (isNaN(day) || isNaN(month) || isNaN(year)) return undefined;
  const date = new Date(year, month - 1, day);
  return date;
}

/**
 * Recursively converts Prisma.Decimal objects to strings to ensure 
 * the object can be passed from Server Components to Client Components.
 */
function serializePrisma(data: any): any {
  if (data === null || data === undefined) return data;

  const type = Object.prototype.toString.call(data);

  // Handle Dates
  if (type === "[object Date]") {
    return data.toISOString();
  }

  // Handle Arrays
  if (type === "[object Array]") {
    return data.map((item: any) => serializePrisma(item));
  }

  // Handle Objects
  if (typeof data === "object") {
    // Detect Prisma.Decimal or any Decimal-like object
    const isDecimal = Prisma.Decimal.isDecimal(data) || 
                      data.constructor?.name === "Decimal" || 
                      (typeof data.toFixed === "function" && typeof data.toNumber === "function") ||
                      (data.d && Array.isArray(data.d) && typeof data.s === 'number');
    
    if (isDecimal) {
      return Number(data.toString());
    }

    // Process all properties
    const result: any = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        result[key] = serializePrisma(data[key]);
      }
    }
    return result;
  }

  return data;
}

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
    return { success: true, data: serializePrisma(order) };
  } catch (error: any) {
    console.error("Error creating draft:", error);
    return { success: false, error: error.message };
  }
}

export async function createWorkOrder(data: any, role: "admin" | "captain" = "admin") {
  // Validate data based on role
  const schema = role === "captain" ? getCaptainSchema() : getAdminSchema();
  const validation = schema.safeParse(data);

  if (!validation.success) {
    return { 
      success: false, 
      error: "Validación fallida: " + validation.error.issues.map((e: any) => e.message).join(", ") 
    };
  }
  // ...
  try {
    const validatedData = validation.data;
    const order = await prisma.workOrder.create({
      data: {
        nombre: validatedData.nombre,
        cell: validatedData.cell,
        fecha: parseDateDMY(validatedData.fechaEmbarque),
        horaSalida: validatedData.horaEmbarque,
        horaLlegado: validatedData.horaLlegado,
        destino: validatedData.destino,
        puntoEncuentro: validatedData.puntoEncuentro,
        pasajeros: validatedData.pasajeros ? Math.floor(Number(validatedData.pasajeros)) : null,
        detallesNotas: validatedData.detallesNotas,
        combustible: validatedData.combustible ? new Prisma.Decimal(validatedData.combustible as any) : 0,
        hielo: validatedData.hielo ? new Prisma.Decimal(validatedData.hielo as any) : 0,
        aguaBebidas: validatedData.aguaBebidas ? new Prisma.Decimal(validatedData.aguaBebidas as any) : 0,
        gastoVarios: validatedData.gastoVarios ? new Prisma.Decimal(validatedData.gastoVarios as any) : 0,
        pagoCapitana: validatedData.pagoCapitana ? new Prisma.Decimal(validatedData.pagoCapitana as any) : 0,
        pagoMarinero: validatedData.pagoMarinero ? new Prisma.Decimal(validatedData.pagoMarinero as any) : 0,
        precioAcordado: validatedData.precioAcordado ? new Prisma.Decimal(validatedData.precioAcordado as any) : 0,
        horasAcordadas: validatedData.horasAcordadas ? new Prisma.Decimal(validatedData.horasAcordadas as any) : 0,
        tarifaHora: validatedData.tarifaHora ? new Prisma.Decimal(validatedData.tarifaHora as any) : 0,
        cargoExtra: validatedData.cargoExtra ? new Prisma.Decimal(validatedData.cargoExtra as any) : 0,
        pagoRecibo: validatedData.pagoRecibo ? new Prisma.Decimal(validatedData.pagoRecibo as any) : 0,
        efectivo: validatedData.efectivo ?? false,
        transferir: validatedData.transferir ?? false,
        pagarAlEmbarque: validatedData.pagarAlEmbarque ? new Prisma.Decimal(validatedData.pagarAlEmbarque as any) : 0,
        debidoABayside: validatedData.debidoABayside ? new Prisma.Decimal(validatedData.debidoABayside as any) : 0,
        totalClienteCost: validatedData.totalClienteCost ? new Prisma.Decimal(validatedData.totalClienteCost as any) : 0,
        deposito: validatedData.deposito ? new Prisma.Decimal(validatedData.deposito as any) : 0,
        saldoCliente: validatedData.saldoCliente ? new Prisma.Decimal(validatedData.saldoCliente as any) : 0,
        horasExtras: validatedData.horasExtras ? new Prisma.Decimal(validatedData.horasExtras as any) : null,
        paymentMethod: validatedData.paymentMethod || null,
        horasExtrasEfectivo: validatedData.horasExtrasEfectivo ?? false,
        horasExtrasTransferir: validatedData.horasExtrasTransferir ?? false,
        pagoHorasExtra: validatedData.pagoHorasExtra ? new Prisma.Decimal(validatedData.pagoHorasExtra as any) : 0,
      },
    });
    revalidatePath("/admin/list");
    return { success: true, data: serializePrisma(order) };
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
    return { success: true, data: serializePrisma(orders) };
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
    return { success: true, data: serializePrisma(order) };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function updateWorkOrder(id: number, data: any, role: "admin" | "captain" = "admin") {
  // Validate data based on role
  const schema = role === "captain" ? getCaptainSchema() : getAdminSchema();
  const validation = schema.safeParse(data);

  if (!validation.success) {
    return { 
      success: false, 
      error: "Validación fallida: " + validation.error.issues.map((e: any) => e.message).join(", ") 
    };
  }

  try {
    // We might want to filter what fields can be updated based on role here too for security,
    // but existing plan implies Form logic + trust for now (or simple check).
    // Since we pass data generically, we trust the caller has filtered or we update what's sent.
    // Ideally we'd separate `updateCaptain` and `updateAdmin` actions.

    // Let's assume data matches schema shape roughly.
    // We need to parse dates ensuring they are valid Date objects if present.
    // Explicitly map fields to match schema, similar to createWorkOrder
    // This prevents passing UI-only fields like 'combustibleCost' to Prisma which causes errors.
    const validatedData = validation.data;
    const updatePayload: any = {
      nombre: validatedData.nombre,
      cell: validatedData.cell,
      fecha: parseDateDMY(validatedData.fechaEmbarque),
      horaSalida: validatedData.horaEmbarque,
      horaLlegado: validatedData.horaLlegado,
      destino: validatedData.destino,
      puntoEncuentro: validatedData.puntoEncuentro,
      pasajeros: validatedData.pasajeros ? Math.floor(Number(validatedData.pasajeros)) : undefined,
      detallesNotas: validatedData.detallesNotas,
      combustible: validatedData.combustible !== undefined ? new Prisma.Decimal(validatedData.combustible as any) : undefined,
      hielo: validatedData.hielo !== undefined ? new Prisma.Decimal(validatedData.hielo as any) : undefined,
      aguaBebidas: validatedData.aguaBebidas !== undefined ? new Prisma.Decimal(validatedData.aguaBebidas as any) : undefined,
      gastoVarios: validatedData.gastoVarios !== undefined ? new Prisma.Decimal(validatedData.gastoVarios as any) : undefined,
      pagoCapitana: validatedData.pagoCapitana !== undefined ? new Prisma.Decimal(validatedData.pagoCapitana as any) : undefined,
      pagoMarinero: validatedData.pagoMarinero !== undefined ? new Prisma.Decimal(validatedData.pagoMarinero as any) : undefined,
      precioAcordado: validatedData.precioAcordado !== undefined ? new Prisma.Decimal(validatedData.precioAcordado as any) : undefined,
      horasAcordadas: validatedData.horasAcordadas !== undefined ? new Prisma.Decimal(validatedData.horasAcordadas as any) : undefined,
      tarifaHora: validatedData.tarifaHora !== undefined ? new Prisma.Decimal(validatedData.tarifaHora as any) : undefined,
      cargoExtra: validatedData.cargoExtra !== undefined ? new Prisma.Decimal(validatedData.cargoExtra as any) : undefined,
      pagoRecibo: validatedData.pagoRecibo !== undefined ? new Prisma.Decimal(validatedData.pagoRecibo as any) : undefined,
      efectivo: validatedData.efectivo,
      transferir: validatedData.transferir,
      pagarAlEmbarque: validatedData.pagarAlEmbarque !== undefined ? new Prisma.Decimal(validatedData.pagarAlEmbarque as any) : undefined,
      debidoABayside: validatedData.debidoABayside !== undefined ? new Prisma.Decimal(validatedData.debidoABayside as any) : undefined,
      totalClienteCost: validatedData.totalClienteCost !== undefined ? new Prisma.Decimal(validatedData.totalClienteCost as any) : undefined,
      deposito: validatedData.deposito !== undefined ? new Prisma.Decimal(validatedData.deposito as any) : undefined,
      saldoCliente: validatedData.saldoCliente !== undefined ? new Prisma.Decimal(validatedData.saldoCliente as any) : undefined,
      horasExtras: validatedData.horasExtras !== undefined ? (validatedData.horasExtras ? new Prisma.Decimal(validatedData.horasExtras as any) : null) : undefined,
      paymentMethod: validatedData.paymentMethod,
      horasExtrasEfectivo: validatedData.horasExtrasEfectivo,
      horasExtrasTransferir: validatedData.horasExtrasTransferir,
      pagoHorasExtra: validatedData.pagoHorasExtra !== undefined ? new Prisma.Decimal(validatedData.pagoHorasExtra as any) : undefined,
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

    return { success: true, data: serializePrisma(order) };
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

    // TODO: Delete receipts from S3
    

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

    // Upload to R2 - pass the FormData instance directly
    const uploadResult = await uploadPhotoToR2(formData);

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
    return { success: true, data: serializePrisma(receipt) };
  } catch (e: any) {
    console.error("Upload receipt: Unexpected error", e);
    return {
      success: false,
      error: e.message || "An unexpected error occurred during upload",
    };
  }
}
