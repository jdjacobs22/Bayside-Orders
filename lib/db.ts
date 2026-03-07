import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/lib/prisma-client/client";

const connectionString = process.env.DATABASE_URL;

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

/**
 * Prisma Client Singleton
 * 
 * Initializes and exports a single PrismaClient instance shared across the application.
 * - Uses the PostgreSQL adapter with a connection pool.
 * - Configured via the DATABASE_URL environment variable.
 */
// @ts-ignore
const prisma = new PrismaClient({ adapter });

export default prisma;
