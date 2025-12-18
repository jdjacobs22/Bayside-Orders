import { auth } from "@/lib/auth";
import prisma from "@/lib/db"; // Assuming lib/db exports prisma client instance
import { NextResponse } from "next/server";

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
