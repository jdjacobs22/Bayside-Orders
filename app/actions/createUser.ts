/**
 * createUser.ts
 * 
 * Server actions for user management.
 * Handles the creation of new user accounts (Admin/Captain) using better-auth,
 * retrieving lists of users, and deleting users from the system.
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
 * Creates a new system user (Admin or Captain).
 * Uses better-auth's API to handle password hashing and session management.
 * 
 * @param data - The user's registration details (name, email, cell, password, role).
 * @returns A success status and the newly created user data, or an error message.
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
    if (session.user.role !== "admin") {
      throw new Error("Unauthorized: Only admins can create users");
    }

    // Check for existing name combination before creating
    const existingName = await prisma.user.findFirst({
      where: {
        nombre: { equals: data.nombre.trim(), mode: 'insensitive' },
        apellido: { equals: data.apellido.trim(), mode: 'insensitive' }
      }
    });

    if (existingName) {
      return { success: false, error: "Ya existe un usuario con este Nombre y Apellido." };
    }

    // Use better-auth signUpEmail to create the user properly with password hashing
    console.log("Creating user with better-auth:", data.email);
    const result = await auth.api.signUpEmail({
        body: {
            email: data.email,
            password: data.password,
            name: `${data.nombre} ${data.apellido}`, 
            nombre: data.nombre,
            apellido: data.apellido,
            cell: data.cell,
            role: data.role,
        }
    });

    if (!result || !result.user) {
        console.error("Better-auth signUpEmail returned no user", result);
        throw new Error("Failed to create user with authentication");
    }

    console.log("Better-auth created user object:", JSON.stringify(result.user));

    // VERIFICATION: Check Prisma directly to see if it's in the DB
    const dbUser = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (dbUser) {
      console.log("VERIFIED: User exists in DB via Prisma:", dbUser.id);
    } else {
      console.error("CRITICAL: User was NOT found in DB via Prisma after creation attempt!");
    }

    revalidatePath("/admin");
    
    // Return ONLY the necessary plain data to avoid serialization errors
    return { 
      success: true, 
      verifiedInDb: !!dbUser,
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
 * Retrieves all registered system users from the database.
 * Restricted to Admin access only.
 * 
 * @returns A success status and the list of user records.
 */
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

/**
 * Deletes a system user by their unique ID.
 * Restricted to Admin access only.
 * 
 * @param userId - The unique identifier of the user to remove.
 * @returns A success status.
 */
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

/**
 * Search helper to find unique last names associated with a first name.
 * 
 * @param nombre - The first name to search for.
 * @returns A list of unique last names (apellidos) that match the search string.
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