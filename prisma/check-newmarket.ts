import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
async function main() {
  const all = await p.mosque.findMany({ where: { isActive: true }, select: { id: true, name: true, latitude: true, longitude: true } });
  const matches = all.filter(m => /newmarket|new market/i.test(m.name));
  console.log(matches);
  await p.$disconnect();
}
main().catch(console.error);
