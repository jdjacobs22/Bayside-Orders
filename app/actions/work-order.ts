/**
 * work-order.ts
 * 
 * Server actions for managing Work Orders. 
 * Includes creating, updating, deleting, and fetching work orders from the database,
 * as well as handling image uploads to R2 and search helpers for client names.
 */
"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { Prisma } from "@/lib/prisma-client/client";
import { uploadPhotoToR2 } from "@/lib/r2-client";
import { getAdminSchema, getCaptainSchema } from "@/lib/schemas";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";


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
    // Broaden detection to be safer
    const isDecimal = data && (
      (typeof Prisma !== 'undefined' && (Prisma as any).Decimal?.isDecimal?.(data)) ||
      data.constructor?.name === "Decimal" || 
      (typeof data.toFixed === "function" && typeof data.toNumber === "function") ||
      (data.d && Array.isArray(data.d) && typeof data.s === 'number')
    );
    
    if (isDecimal) {
      const val = data.toString();
      const num = Number(val);
      return isNaN(num) ? val : num; // Return string if Number() fails
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

// createDraftWorkOrder is commented out. It was intended to create a blank order to get an ID for early photo uploads.

// Helper to get session and validate role
async function getSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}

/*
export async function createDraftWorkOrder() {
  try {
    const session = await getSession();
    // Only admins can create drafts (adjust if needed)
    if (session.user.role !== "admin") {
        throw new Error("Unauthorized: Only admins can create drafts");
    }

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
*/

/**
 * Creates a new Work Order in the database.
 * 
 * @param data - The form data object to validate and save.
 * @param role - The role of the user performing the action ("admin" | "captain"). Defaults to "admin".
 * @returns An object indicating success and containing the serialized order, or a failure message.
 */
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
    const session = await getSession();
    // Validate role permissions - Create is generally Admin only, but if Captains can create:
    if (role === "captain" && session.user.role !== "captain") throw new Error("Role mismatch");
    if (role === "admin" && (session.user.role !== "admin" && session.user.role !== "representante")) throw new Error("Role mismatch");
    
    // Additional security: Maybe captains can only create if assigned? 
    // For now assuming existing flow is correct, but let's enforce role check.
    
    const validatedData = validation.data;
    const order = await prisma.workOrder.create({
      data: {
        nombre: validatedData.nombre,
        apellido: validatedData.apellido,
        email: validatedData.email,
        cell: validatedData.cell,
        cliente: validatedData.cliente,
        clienteCell: validatedData.clienteCell,
        clienteEmail: validatedData.clienteEmail,
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
        captainId: role === "admin" && validatedData.captainId ? validatedData.captainId : undefined,
      },
    });
    try {
      revalidatePath("/admin/list");
    } catch (err) {
      console.error("Revalidation error (non-fatal):", err);
    }
    return { success: true, data: serializePrisma(order) };
  } catch (error: any) {
    console.error("Error creating order:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Retrieves all Work Orders from the database, ordered by flight date descending.
 * 
 * @returns An object with success status and the list of serialized Work Orders.
 */
export async function getWorkOrders() {
  try {
    const session = await getSession();
    
    const whereClause: any = {};
    if (session.user.role === "captain") {
        whereClause.captainId = session.user.id;
    }

    const orders = await prisma.workOrder.findMany({
      where: whereClause,
      orderBy: { id: "desc" },
      take: 100, // Limit for now
    });
    return { success: true, data: serializePrisma(orders) };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

/**
 * Retrieves a single Work Order by its unique ID.
 * Includes related receipts in the result.
 * 
 * @param id - The numeric ID of the Work Order to fetch.
 * @returns An object with success status and the serialized Work Order data.
 */
export async function getWorkOrder(id: number) {
  try {
    // Validate that id is a valid number
    if (!id || isNaN(id) || !Number.isInteger(id)) {
      return { success: false, error: "ID de orden inválido" };
    }

    const session = await getSession();

    const order = await prisma.workOrder.findUnique({
      where: { id },
      include: { receipts: true },
    });
    if (!order) return { success: false, error: `La orden #${id} no existe.` };

    // RBAC Check
    if (session.user.role === "captain") {
        if (order.captainId !== session.user.id) {
            return { success: false, error: "No tienes autorización para acceder a esta orden." };
        }
    } else if (session.user.role !== "admin" && session.user.role !== "representante") {
        // Fallback for any other future roles, though only captain/admin exist now
        return { success: false, error: "Unauthorized" };
    }

    return { success: true, data: serializePrisma(order) };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

/**
 * Updates an existing Work Order in the database.
 * 
 * @param id - The ID of the Work Order to update.
 * @param data - The partial or full form data to update.
 * @param role - The role of the user performing the update. Defaults to "admin".
 * @returns An object indicating success and containing the updated serialized order.
 */
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
    const session = await getSession();

    // Verify access before update
    const existingOrder = await prisma.workOrder.findUnique({ 
        where: { id },
        select: { captainId: true } 
    });
    
    if (!existingOrder) return { success: false, error: "Order not found" };

    if (session.user.role === "captain") {
        if (existingOrder.captainId !== session.user.id) {
             return { success: false, error: "Unauthorized: You cannot edit this order." };
        }
    } else if (session.user.role !== "admin" && session.user.role !== "representante") {
         return { success: false, error: "Unauthorized" };
    }

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
      apellido: validatedData.apellido,
      email: validatedData.email,
      cell: validatedData.cell,
      cliente: validatedData.cliente,
      clienteCell: validatedData.clienteCell,
      clienteEmail: validatedData.clienteEmail,
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
      captainId: role === "admin" && validatedData.captainId !== undefined ? validatedData.captainId : undefined,
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

/**
 * Deletes a Work Order and its associated receipts from the database.
 * 
 * @param id - The ID of the Work Order to delete.
 * @returns An object with success status.
 */
export async function deleteWorkOrder(id: number) {
  try {
    const session = await getSession();
    if (session.user.role !== "admin" && session.user.role !== "representante") {
        return { success: false, error: "Unauthorized: Only admins can delete orders" };
    }
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
    // TODO: Delete receipts from S3
    
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

/**
 * Helper search function to find matching last names (apellidos) for a given first name.
 * Used for auto-completing client information.
 * 
 * @param nombre - The first name to search for.
 * @returns An array of unique last names found for that first name.
 */
export async function getClientApellidosByNombre(nombre: string) {
  if (!nombre || nombre.trim().length === 0) return { success: true, data: [] };
  
  try {
    const trimmedNombre = nombre.trim();
    
    // Only fetch from User table as requested
    const users = await prisma.user.findMany({
      where: { nombre: { startsWith: trimmedNombre, mode: 'insensitive' } },
      select: { apellido: true },
      distinct: ['apellido'],
    });

    const userApellidos = users.map(u => u.apellido).filter(Boolean);
    
    // deduplicate
    const combined = Array.from(new Set(userApellidos));
    combined.sort((a, b) => a.localeCompare(b));

    return { success: true, data: combined };
  } catch (error: any) {
    console.error("Error fetching apellidos by nombre:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Retrieves specific client details (phone and email) based on a first and last name match.
 * 
 * @param nombre - Client first name.
 * @param apellido - Client last name.
 * @returns An object with success status and the client details (cell, email).
 */
export async function getClientDetails(nombre: string, apellido: string) {
  if (!nombre || !apellido) return { success: false, error: "Missing name or last name" };
  
  try {
    // Only check User table as requested
    const clientData = await prisma.user.findFirst({
      where: {
        nombre: { equals: nombre.trim(), mode: 'insensitive' },
        apellido: { equals: apellido.trim(), mode: 'insensitive' }
      },
      select: {
        id: true,
        email: true,
        cell: true
      }
    });

    return { success: true, data: clientData };
  } catch (error: any) {
    console.error("Error fetching client details:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Retrieves a list of unique first names (nombres) from all existing Work Orders.
 * Used for auto-completion suggestions in the form.
 * 
 * @returns An array of unique first name strings.
 */
export async function getUniqueNombresFromUsers() {
  try {
    const users = await prisma.user.findMany({
      select: { nombre: true },
      distinct: ['nombre'],
    });

    const userNombres = users.map(u => u.nombre).filter(Boolean);
    const combined = Array.from(new Set(userNombres));
    combined.sort((a, b) => a.localeCompare(b));

    return { success: true, data: combined };
  } catch (error: any) {
    console.error("Error fetching unique nombres from users:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Handles the upload of a receipt image for a specific Work Order.
 * 
 * Process:
 * 1. Validates the session.
 * 2. Uploads the file to Cloudflare R2 storage.
 * 3. Records the receipt metadata (URL, type) in the PostgreSQL database.
 * 
 * @param formData - Multi-part form data containing the 'file', 'orderId', and 'gastoType'.
 * @returns An object with the success status and the created receipt record.
 */
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

    // Auth check for upload
    const session = await auth.api.getSession({
        headers: await headers(),
    });
    if (!session) {
        return { success: false, error: "Unauthorized" };
    }
    
    // Verify ownership if captain
    if (session.user.role === "captain") {
        const order = await prisma.workOrder.findUnique({ 
            where: { id: orderId },
            select: { captainId: true }
        });
        if (!order || order.captainId !== session.user.id) {
            return { success: false, error: "Unauthorized: You cannot upload to this order." };
        }
    } else if (session.user.role !== "admin" && session.user.role !== "representante") {
        return { success: false, error: "Unauthorized" };
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
