
import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

/**
 * GET /api/users
 * 
 * Retrieves a list of users from the database, optionally filtered by role.
 * Access is restricted to Admin users only.
 * 
 * @param request - The incoming HTTP request.
 * @param request.nextUrl.searchParams.role - Optional role filter (e.g., 'captain').
 * @returns A JSON response containing an array of user objects with basic details (id, nombre, apellido, role, cell).
 */
export async function GET(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || (session.user.role !== "admin" && session.user.role !== "representante")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const role = searchParams.get("role");

  try {
    const where: any = {};
    if (role) {
      where.role = role;
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        nombre: true,
        apellido: true,
        role: true,
        cell: true,
      },
    });

    return NextResponse.json({ users });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}
