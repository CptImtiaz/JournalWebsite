import { execSync } from "node:child_process";
const run = (c) => execSync(c, { stdio: "inherit" });
// Vercel/Neon expose POSTGRES_* or DATABASE_URL; normalise.
process.env.DATABASE_URL ||= process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL || "";
process.env.DATABASE_URL_UNPOOLED ||= process.env.POSTGRES_URL_NON_POOLING || process.env.DATABASE_URL;
run("npx prisma generate");
if (process.env.DATABASE_URL) {
  run("npx prisma db push --skip-generate");
  run("node --experimental-strip-types --no-warnings prisma/seed.ts");
} else {
  console.warn("\n⚠ No DATABASE_URL — skipping schema sync and seed. Connect a PostgreSQL database and redeploy.\n");
}
run("npx next build");
