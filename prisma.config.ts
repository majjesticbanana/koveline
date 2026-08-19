import path from "node:path";
import { defineConfig } from "prisma/config";

// Prisma 7 no longer auto-loads .env for the CLI, so load it ourselves.
// (Node 22.15+ provides process.loadEnvFile.)
try {
  process.loadEnvFile();
} catch {
  // .env may be absent in CI / production — env is provided another way.
}

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  // Migrations and `db push` connect directly (session pooler, port 5432).
  // The pgbouncer transaction pooler used at runtime can't run migrations.
  datasource: {
    url: process.env.DIRECT_URL,
  },
});
