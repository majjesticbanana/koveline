/**
 * Create (or promote) the first admin account.
 *
 *   npx tsx scripts/seed-admin.ts <email> <password> [name]
 *
 * or set ADMIN_EMAIL / ADMIN_PASSWORD / ADMIN_NAME in the environment.
 *
 * Runs outside Next, so it builds its own Prisma client + adapter rather than
 * importing lib/prisma.ts (which pulls in `server-only`).
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

try {
  process.loadEnvFile();
} catch {
  /* env provided another way */
}

async function main() {
  const email = (process.argv[2] ?? process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  const password = process.argv[3] ?? process.env.ADMIN_PASSWORD ?? "";
  const name = process.argv[4] ?? process.env.ADMIN_NAME ?? null;

  if (!email || !password) {
    console.error("Usage: tsx scripts/seed-admin.ts <email> <password> [name]");
    console.error("   or set ADMIN_EMAIL and ADMIN_PASSWORD");
    process.exit(1);
  }
  if (password.length < 8) {
    console.error("Password must be at least 8 characters.");
    process.exit(1);
  }

  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const prisma = new PrismaClient({ adapter: new PrismaPg(url) });

  const passwordHash = await bcrypt.hash(password, 12);
  const student = await prisma.student.upsert({
    where: { email },
    update: { role: "ADMIN", disabled: false, passwordHash, ...(name ? { name } : {}) },
    create: { email, name, role: "ADMIN", passwordHash },
    select: { id: true, email: true, role: true },
  });

  console.log(`✔ Admin ready: ${student.email} (${student.id})`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
