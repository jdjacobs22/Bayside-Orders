/**
 * createUser.ts
 * 
 * Server actions for user management.
 */
"use server";

import prisma from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

async function getSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}

/**
 * Creates a new system user (Admin, Captain, or Representante).
 * uses the official better-auth Admin API for secure account creation,
 * allowing roles to be assigned by administrators.
 */
export async function createUser(data: {
  nombre: string;
  apellido: string;
  email: string;
  cell: string;
  password: string;
  role: "admin" | "captain" | "representante";
}) {
  try {
    const session = await getSession();
    if ((session.user as any).role !== "admin") {
      throw new Error("Unauthorized: Only admins can create users");
    }

    // Check for existing user collision
    const existingName = await prisma.user.findFirst({
      where: {
        nombre: { equals: data.nombre.trim(), mode: 'insensitive' },
        apellido: { equals: data.apellido.trim(), mode: 'insensitive' }
      }
    });

    if (existingName) {
      return { success: false, error: "Ya existe un usuario con este Nombre y Apellido." };
    }

    // Official Single-Call Creation via Admin API.
    // The databaseInterceptor in lib/auth.ts ensures custom fields (nombre, etc.)
    // are correctly persisted in the same transaction.
    const api = (auth as any).api;
    const adminCreateUser = api.admin?.createUser || api.createUser;

    if (!adminCreateUser) {
        throw new Error("Better-Auth admin API not found.");
    }

    const result = await adminCreateUser({
        headers: await headers(),
        body: {
            email: data.email,
            password: data.password,
            name: `${data.nombre} ${data.apellido}`,
            role: data.role,
            nombre: data.nombre,
            apellido: data.apellido,
            cell: data.cell,
        }
    });

    if (!result || !result.user) {
        throw new Error("Failed to create user through authentication library");
    }

    // Explicitly persist cell since Better Auth admin API may strip custom fields
    await prisma.user.update({
        where: { id: result.user.id },
        data: { cell: data.cell },
    });

    revalidatePath("/admin/users");
    revalidatePath("/admin/add-user");
    
    return { 
      success: true, 
      data: {
        id: result.user.id,
        email: result.user.email,
        nombre: (result.user as any).nombre,
        apellido: (result.user as any).apellido,
        role: (result.user as any).role,
      }
    };
  } catch (error: any) {
    console.error("Error creating user:", error);
    const msg = error?.message || error?.error?.message || "An unexpected error occurred";
    return { success: false, error: msg };
  }
}

/**
 * Retrieves all registered system users.
 */
export async function getUsers() {
  try {
    const session = await getSession();
    if ((session.user as any).role !== "admin") {
      throw new Error("Unauthorized: Only admins can view users");
    }

    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    });
    return { success: true, data: users };
  } catch (error: any) {
    console.error("Error fetching users:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Deletes a system user. 
 */
export async function deleteUser(userId: string) {
  try {
    const session = await getSession();
    if ((session.user as any).role !== "admin") {
      throw new Error("Unauthorized: Only admins can delete users");
    }

    await prisma.user.delete({
      where: { id: userId },
    });
    revalidatePath("/admin");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting user:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Search helper for names.
 */
export async function getApellidosByNombre(nombre: string) {
  if (!nombre || nombre.trim() === "") return { success: true, data: [] };
  try {
    const users = await prisma.user.findMany({
      where: {
        nombre: {
          equals: nombre.trim(),
          mode: 'insensitive'
        }
      },
      select: { apellido: true },
      distinct: ['apellido']
    });
    return { success: true, data: users.map(u => u.apellido) };
  } catch (error: any) {
    console.error("Error fetching apellidos:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Admin password reset.
 */
export async function changeUserPassword(userId: string, newPassword: string) {
  try {
    const session = await getSession();
    if ((session.user as any).role !== "admin") {
      throw new Error("Unauthorized: Only admins can change passwords");
    }

    const api = (auth as any).api;
    const resetMethod = api.setUserPassword || api.admin?.setUserPassword;

    if (!resetMethod) {
        throw new Error("Method 'setUserPassword' not found on Better-Auth API.");
    }

    await resetMethod({
        headers: await headers(),
        body: {
            userId,
            newPassword
        }
    });

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error: any) {
    console.error("Critical error in changeUserPassword action:", error);
    const detailMessage = error?.message || "Ocurrió un error inesperado al actualizar la contraseña";
    return { success: false, error: detailMessage };
  }
}