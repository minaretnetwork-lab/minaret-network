import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS professional_lead_dismissals (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      professional_id TEXT NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
      service_request_id TEXT NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
      reason TEXT NOT NULL,
      note TEXT,
      dismissed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE(professional_id, service_request_id)
    )
  `);
  console.log("Table created successfully");
  await prisma.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
