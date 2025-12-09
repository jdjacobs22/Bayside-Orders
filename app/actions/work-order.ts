"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

export async function createWorkOrder(data: any) {
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
            orderBy: { id: 'desc' },
            take: 100 // Limit for now
        });
        return { success: true, data: orders };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function getWorkOrder(id: number) {
    try {
        const order = await prisma.workOrder.findUnique({
            where: { id },
            include: { receipts: true }
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
        const updateData: any = { ...data };
        if (updateData.fecha) updateData.fecha = new Date(updateData.fecha);

        const order = await prisma.workOrder.update({
            where: { id },
            data: updateData
        });
        revalidatePath(`/captain/order/${id}`);
        revalidatePath(`/admin/order/${id}`);
        return { success: true, data: order };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function uploadReceipt(formData: FormData) {
    try {
        const file = formData.get("file") as File;
        const orderId = Number(formData.get("orderId"));
        
        if (!file || !orderId) return { success: false, error: "Missing file or order ID" };

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Ensure public/uploads exists
        const uploadDir = join(process.cwd(), "public/uploads");
        await mkdir(uploadDir, { recursive: true });

        const filename = `${orderId}-${Date.now()}-${file.name.replace(/\s/g, '_')}`;
        const filepath = join(uploadDir, filename);

        await writeFile(filepath, buffer);
        
        const url = `/uploads/${filename}`;

        const receipt = await prisma.receipt.create({
            data: {
                url,
                workOrderId: orderId
            }
        });

        revalidatePath(`/captain/order/${orderId}`);
        return { success: true, data: receipt };

    } catch (e: any) {
        console.error("Upload error:", e);
        return { success: false, error: e.message };
    }
}
