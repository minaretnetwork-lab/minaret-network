import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
async function main() {
  const all = await p.mosque.findMany({
    where: { isActive: true, OR: [{ latitude: null }, { longitude: null }] },
    select: { id: true, name: true, city: true, address: true },
    orderBy: { name: "asc" },
  });
  console.log(`${all.length} mosques without coordinates:\n`);
  all.forEach(m => console.log(`  ${m.name} | ${m.city ?? "?"} | ${m.address ?? "?"}`));
  await p.$disconnect();
}
main().catch(console.error);
