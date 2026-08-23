import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // Make userId nullable on professionals
  await prisma.$executeRawUnsafe(`
    ALTER TABLE professionals
      ALTER COLUMN "userId" DROP NOT NULL
  `);
  console.log('✓ professionals."userId" is now nullable');

  // Add isAdminCreated, claimedByUserId, claimedAt
  await prisma.$executeRawUnsafe(`
    ALTER TABLE professionals
      ADD COLUMN IF NOT EXISTS "isAdminCreated"  BOOLEAN   NOT NULL DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS "claimedByUserId" TEXT,
      ADD COLUMN IF NOT EXISTS "claimedAt"       TIMESTAMPTZ
  `);
  console.log("✓ Added isAdminCreated, claimedByUserId, claimedAt to professionals");

  // Create ClaimStatus enum
  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      CREATE TYPE "ClaimStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `);
  console.log("✓ ClaimStatus enum ready");

  // Create profile_claims table
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS profile_claims (
      id               TEXT          NOT NULL PRIMARY KEY,
      "professionalId" TEXT          NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
      "userId"         TEXT          NOT NULL REFERENCES users(id),
      "claimantName"   TEXT          NOT NULL,
      "claimantEmail"  TEXT          NOT NULL,
      "claimantPhone"  TEXT,
      "claimantNote"   TEXT          NOT NULL,
      status           "ClaimStatus" NOT NULL DEFAULT 'PENDING',
      "adminNote"      TEXT,
      "createdAt"      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
      "reviewedAt"     TIMESTAMPTZ,
      UNIQUE ("professionalId", "userId")
    )
  `);
  console.log("✓ profile_claims table ready");

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS profile_claims_status_created_at
      ON profile_claims(status, "createdAt")
  `);
  console.log("✓ Index on profile_claims(status, createdAt)");

  console.log("Migration complete.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
