/**
 * Prisma client singleton. Under Prisma 7 the runtime connects through a
 * driver adapter — here the `pg` adapter pointed at Supabase's pooled
 * (pgbouncer) connection string. A single instance is reused across hot
 * reloads in dev so we don't exhaust the connection pool.
 */
import "server-only";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set — see .env");
}

const createClient = () => new PrismaClient({ adapter: new PrismaPg(connectionString) });

const globalForPrisma = globalThis as unknown as { prisma?: ReturnType<typeof createClient> };

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
