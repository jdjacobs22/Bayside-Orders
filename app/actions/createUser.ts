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

export async function createUser(data: {
  nombre: string;
  apellido: string;
  email: string;
  cell: string;
  role?: "admin" | "captain";
}) {
  try {
    const session = await getSession();
    if (session.user.role !== "admin") {
      throw new Error("Unauthorized: Only admins can create users");
    }

    const user = await prisma.user.create({
      data: {
        nombre: data.nombre,
        apellido: data.apellido,
        email: data.email,
        cell: data.cell,
        emailVerified: false,
        role: data.role === "admin" ? "admin" : "captain",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    revalidatePath("/admin");
    return { success: true, data: user };
  } catch (error: any) {
    console.error("Error creating user:", error);
    return { success: false, error: error.message };
  }
}

export async function getUsers() {
  try {
    const session = await getSession();
    if (session.user.role !== "admin") {
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

export async function deleteUser(userId: string) {
  try {
    const session = await getSession();
    if (session.user.role !== "admin") {
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