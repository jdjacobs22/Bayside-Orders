"use server";

import prisma from "@/lib/db";
import { randomUUID } from "crypto";
// import { revalidatePath } from "next/cache";
// import { writeFile, mkdir } from "fs/promises";
// import { join } from "path";

export async function createUser(data: {
  name: string;
  email: string;
  role?: "admin" | "captain" | "user";
}) {
  try {
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        emailVerified: false,
        role: data.role || "user",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    return { success: true, data: user };
  } catch (error: any) {
    console.error("Error creating user:", error);
    return { success: false, error: error.message };
  }
}