import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const result = await prisma.user.updateMany({
    where: { email: "nafees.haq@gmail.com" },
    data: { role: "SUPER_ADMIN" },
  });
  console.log(`Updated ${result.count} user(s) to SUPER_ADMIN`);
}
main().catch(console.error).finally(() => prisma.$disconnect());
