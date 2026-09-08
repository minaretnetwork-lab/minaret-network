import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS professional_lead_dismissals`);
  await prisma.$executeRawUnsafe(`
    CREATE TABLE professional_lead_dismissals (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      "professionalId" TEXT NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
      "serviceRequestId" TEXT NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
      reason TEXT NOT NULL,
      note TEXT,
      "dismissedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE("professionalId", "serviceRequestId")
    )
  `);
  console.log("Table recreated with correct camelCase column names");
  await prisma.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
