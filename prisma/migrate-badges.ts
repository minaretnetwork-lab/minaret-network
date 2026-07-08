/**
 * Run this BEFORE `prisma db push` when changing the BadgeType enum.
 * 1. Adds MOSQUE_AFFILIATED to the existing enum
 * 2. Updates MOSQUE_VERIFIED → MOSQUE_AFFILIATED
 * 3. Deletes any remaining legacy badge types
 *
 * Usage: npx tsx prisma/migrate-badges.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Step 1: Add MOSQUE_AFFILIATED to existing enum (cannot be in a transaction)
  // ALTER TYPE ... ADD VALUE requires its own statement outside a transaction
  await prisma.$executeRaw`ALTER TYPE "BadgeType" ADD VALUE IF NOT EXISTS 'MOSQUE_AFFILIATED'`;
  console.log("Added MOSQUE_AFFILIATED to BadgeType enum.");

  // Step 2: Rename MOSQUE_VERIFIED → MOSQUE_AFFILIATED
  const updated = await prisma.$executeRaw`
    UPDATE "verification_badges"
    SET type = 'MOSQUE_AFFILIATED'
    WHERE type = 'MOSQUE_VERIFIED'
  `;
  console.log(`Updated ${updated} MOSQUE_VERIFIED badge(s) to MOSQUE_AFFILIATED.`);

  // Step 3: Delete any remaining legacy badge types
  const deleted = await prisma.$executeRaw`
    DELETE FROM "verification_badges"
    WHERE type IN ('IDENTITY_VERIFIED', 'CREDENTIALS_VERIFIED', 'MOSQUE_VERIFIED')
  `;
  console.log(`Deleted ${deleted} remaining legacy badge(s).`);

  console.log("Done. Now run: npx prisma db push");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
