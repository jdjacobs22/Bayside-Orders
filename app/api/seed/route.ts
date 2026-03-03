import { auth } from "@/lib/auth";
import prisma from "@/lib/db"; // Assuming lib/db exports prisma client instance
import { NextResponse } from "next/server";

/**
 * GET handler for the database seeding route.
 * This endpoint creates initial administrative and captain users if they don't exist
 * and ensures their roles are correctly synchronized in the database.
 * 
 * @returns {Promise<NextResponse>} A JSON response indicating seeding success or failure.
 */
export async function GET() {
    try {
        console.log("Seeding via API...");
        
        // Admin
        try {
             await auth.api.signUpEmail({
                body: {
                    email: "admin@bayside.com",
                    password: "password123",
                    name: "Admin User",
                    nombre: "Admin",
                    apellido: "User",
                    cell: "0000000000",
                    role: "admin",
                }
            });
        } catch(e) { console.log("Admin exists/error", e) }

        // Captain
         try {
             await auth.api.signUpEmail({
                body: {
                    email: "captain@bayside.com",
                    password: "password123",
                    name: "Captain User",
                    nombre: "Captain",
                    apellido: "User",
                    cell: "1111111111",
                    role: "captain",
                }
            });
        } catch(e) { console.log("Captain exists/error", e) }

        // Update Roles
        await prisma.user.update({ where: { email: "admin@bayside.com" }, data: { role: "admin" } });
        await prisma.user.update({ where: { email: "captain@bayside.com" }, data: { role: "captain" } });
        
        return NextResponse.json({ success: true, message: "Seeding complete" });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
