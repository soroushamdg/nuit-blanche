// Prisma 7: connection URL lives here (not in schema).
// Load .env.local first so CLI (migrate, generate) sees DATABASE_URL.
import { config } from "dotenv";
config({ path: ".env.local" });
config(); // fallback to .env
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
