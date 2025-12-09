import { PrismaClient } from "@/lib/prisma-client";
import { auth } from "@/lib/auth";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  try {
      // Create Admin
      await auth.api.signUpEmail({
        body: {
            email: "admin@bayside.com",
            password: "password123",
            name: "Admin User",
            // We can't set role directly in signUpEmail usually unless we extend the schema/types or use a hook.
            // So we sign up, then update the role.
        }
      });
      console.log("Created Admin User");
  } catch (e) {
      console.log("Admin user might already exist");
  }

  try {
      // Create Captain
       await auth.api.signUpEmail({
        body: {
            email: "captain@bayside.com",
            password: "password123",
            name: "Captain User",
        }
      });
      console.log("Created Captain User");
  } catch (e) {
       console.log("Captain user might already exist");
  }
  
  // Update Roles
  await prisma.user.update({
      where: { email: "admin@bayside.com" },
      data: { role: "admin" }
  });
   await prisma.user.update({
      where: { email: "captain@bayside.com" },
      data: { role: "captain" }
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
