/**
 * Creates (or updates the password for) the single admin account.
 *
 * Usage:
 *   npx tsx scripts/create-admin.ts your-password-here
 *
 * The email is fixed to musabmuhammadabubakar@gmail.com since this platform
 * only has one admin. Run this once after setting up your database, and
 * again any time you want to change the password.
 */
import { eq } from "drizzle-orm";
import { db } from "../src/lib/db";
import { admins } from "../src/db/schema";
import { hashPassword } from "../src/lib/auth";

const ADMIN_EMAIL = "musabmuhammadabubakar@gmail.com";

async function main() {
  const password = process.argv[2];
  if (!password) {
    console.error("Usage: npx tsx scripts/create-admin.ts <password>");
    process.exit(1);
  }
  if (password.length < 8) {
    console.error("Password must be at least 8 characters.");
    process.exit(1);
  }

  const passwordHash = await hashPassword(password);

  const existing = await db.select().from(admins).where(eq(admins.email, ADMIN_EMAIL)).limit(1);

  if (existing[0]) {
    await db.update(admins).set({ passwordHash }).where(eq(admins.email, ADMIN_EMAIL));
    console.log(`Updated password for ${ADMIN_EMAIL}`);
  } else {
    await db.insert(admins).values({ email: ADMIN_EMAIL, passwordHash });
    console.log(`Created admin account for ${ADMIN_EMAIL}`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
