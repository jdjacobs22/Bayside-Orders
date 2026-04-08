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
    if ((session.user as any).role !== "admin") {
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

    // STEP 1: Create the account structure using the CORE API.
    // This handles the password hashing and basic user entry.
    // We do NOT pass the role here to avoid security blocks; it will default to 'user'.
    console.log("Step 1: Creating user foundation with signUpEmail:", data.email);
    const api = (auth as any).api;
    
    if (!api || !api.signUpEmail) {
        throw new Error("Better-Auth signUpEmail API not found.");
    }

    const signUpResult = await api.signUpEmail({
        headers: await headers(),
        body: {
            email: data.email,
            password: data.password,
            name: `${data.nombre} ${data.apellido}`,
        }
    });

    if (!signUpResult || !signUpResult.user) {
        console.error("Step 1 Failed: Better-auth signUpEmail returned no user", signUpResult);
        throw new Error("Failed to create user account profile");
    }

    const userId = signUpResult.user.id;
    console.log("Step 1 Success: User created with ID:", userId);

    // STEP 2: Force the Role and Custom Fields via Prisma.
    // This is the only way to bypass the library's internal field-stripping.
    console.log("Step 2: Directly updating Role and Custom Fields via Prisma...");
    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
            role: data.role,
            nombre: data.nombre,
            apellido: data.apellido,
            cell: data.cell,
        }
    });

    console.log("Step 2 Success: User profile finalized with role:", updatedUser.role);

    revalidatePath("/admin/users");
    revalidatePath("/admin/add-user");
    
    return { 
      success: true, 
      verifiedInDb: true,
      data: {
        id: userId,
        email: updatedUser.email,
        nombre: updatedUser.nombre,
        apellido: updatedUser.apellido,
        role: updatedUser.role,
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
 * Deletes a system user by their unique ID.
 * Restricted to Admin access only.
 * 
 * @param userId - The unique identifier of the user to remove.
 * @returns A success status.
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

/**
 * Administrative password reset for a specific user ID.
 * Uses the better-auth admin plugin to bypass current password requirement.
 * 
 * @param userId - The target user's unique ID.
 * @param newPassword - The new password to set.
 * @returns Success or error status.
 */
export async function changeUserPassword(userId: string, newPassword: string) {
  try {
    const session = await getSession();
    if ((session.user as any).role !== "admin") {
      throw new Error("Unauthorized: Only admins can change passwords");
    }

    console.log("Attempting administrative password reset for user ID:", userId);
    
    // Better-auth 1.x admin plugin exposes methods via auth.api.admin
    // in some versions it's flattened as auth.api.setUserPassword
    // We explicitly cast to any to reach the dynamic plugin methods
    const api = (auth as any).api;
    
    if (!api) {
        throw new Error("Better-Auth API not found.");
    }

    // setUserPassword is the specific method for admin resets
    // We MUST pass headers so the admin plugin can verify the session
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

    console.log("Password reset successfully confirmed for user ID:", userId);
    revalidatePath("/admin/users");
    return { success: true };
  } catch (error: any) {
    console.error("Critical error in changeUserPassword action:", error);
    const detailMessage = error?.message || "Ocurrió un error inesperado al actualizar la contraseña";
    return { success: false, error: detailMessage };
  }
}