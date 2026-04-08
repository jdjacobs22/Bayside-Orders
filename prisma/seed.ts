import "dotenv/config";
import prisma from "@/lib/db";
import { auth } from "@/lib/auth";

async function main() {
  console.log("Seeding database...");

  const users = [
    {
      email: "admin@bayside.com",
      password: "password123",
      name: "Admin User",
      nombre: "Admin",
      apellido: "Base",
      cell: "0000000000",
      role: "admin",
    },
    {
      email: "captain@bayside.com",
      password: "password123",
      name: "Captain User",
      nombre: "Captain",
      apellido: "Test",
      cell: "1111111111",
      role: "captain",
    },
  ];

  for (const userData of users) {
    try {
      console.log(`Checking/Creating user: ${userData.email}`);
      // Remove role from body as Better-Auth may block it during sign-up
      const { role, ...signUpData } = userData;
      await (auth.api as any).signUpEmail({
        body: signUpData,
      });
      console.log(`Created user: ${userData.email}`);
    } catch (e: any) {
      if (e.code === "USER_ALREADY_EXISTS" || e.message?.includes("already exists")) {
        console.log(`User ${userData.email} already exists, skipping creation.`);
      } else {
        console.error(`Failed to create ${userData.email}:`, e);
      }
    }

    // Ensure role is correct (sometimes sign-up might default it)
    await prisma.user.update({
      where: { email: userData.email },
      data: { role: userData.role as any },
    });
    console.log(`Role for ${userData.email} ensured as ${userData.role}`);
  }

  console.log("Seeding complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
