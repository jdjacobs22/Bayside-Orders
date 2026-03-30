import prisma from "@/lib/db";
import { auth } from "@/lib/auth";

async function main() {
  console.log("Seeding database...");

  try {
    // Create Admin
    await (auth.api as any).signUpEmail({
      body: {
        email: "admin@bayside.com",
        password: "password123",
        name: "Admin User",
        nombre: "Admin",
        apellido: "Base",
        cell: "0000000000",
        role: "admin",
      },
    });
    console.log("Created Admin User");
  } catch (e) {
    console.log("Admin user might already exist");
  }

  try {
    // Create Captain
    await (auth.api as any).signUpEmail({
      body: {
        email: "captain@bayside.com",
        password: "password123",
        name: "Captain User",
        nombre: "Captain",
        apellido: "Test",
        cell: "1111111111",
        role: "captain",
      },
    });
    console.log("Created Captain User");
  } catch (e) {
    console.log("Captain user might already exist");
  }

  // Update Roles
  await prisma.user.update({
    where: { email: "admin@bayside.com" },
    data: { role: "admin" },
  });
  await prisma.user.update({
    where: { email: "captain@bayside.com" },
    data: { role: "captain" },
  });

  console.log("Roles updated.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
