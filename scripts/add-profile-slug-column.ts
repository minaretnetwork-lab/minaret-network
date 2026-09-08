import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  await prisma.$executeRawUnsafe(`ALTER TABLE professionals ADD COLUMN IF NOT EXISTS "profileSlug" TEXT UNIQUE`);
  console.log("profileSlug column added");
  await prisma.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
