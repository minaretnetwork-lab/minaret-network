import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const count = await prisma.professionalLeadDismissal.count();
  console.log("professionalLeadDismissal count:", count);
  await prisma.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
