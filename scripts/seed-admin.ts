import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "@/lib/auth";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "kingrhmestherapper@gmail.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "KingRhymes2026!";
const ADMIN_SETUP_TOKEN = process.env.ADMIN_SETUP_TOKEN || "6Ini0vkZ4R48H17Zq8O3KYqqLXk1QmyFujHnSGACyk0dQ3TCuqIczbNOdfqBUvhg";

async function seedAdmin() {
  const existing = await db.select().from(users).where(eq(users.email, ADMIN_EMAIL));
  if (existing.length) {
    console.log(`Admin user already exists: ${ADMIN_EMAIL}`);
    console.log(`To reset password, delete the user and re-run this script.`);
    return;
  }
  const hash = await hashPassword(ADMIN_PASSWORD);
  const inserted = await db
    .insert(users)
    .values({
      email: ADMIN_EMAIL,
      passwordHash: hash,
      displayName: "King Rhymes",
      role: "admin",
      provider: "email",
    })
    .returning();
  console.log(`✅ Admin user created: ${ADMIN_EMAIL}`);
  console.log(`   Password: ${ADMIN_PASSWORD}`);
  console.log(`   Role: admin`);
  console.log(`   ID: ${inserted[0].id}`);
}

seedAdmin()
  .then(() => {
    console.log("Done.");
    process.exit(0);
  })
  .catch((e) => {
    console.error("Failed to seed admin:", e);
    process.exit(1);
  });