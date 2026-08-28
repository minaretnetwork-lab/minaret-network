import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
async function main() {
  const mosque = await p.mosque.findFirst({
    where: { name: "Islamic Foundation of Toronto", city: "Scarborough", latitude: null },
    select: { id: true, name: true, city: true },
  });
  if (!mosque) { console.log("Not found or already has coords."); return; }
  await p.mosque.update({ where: { id: mosque.id }, data: { latitude: 43.7810, longitude: -79.2621 } });
  console.log("Updated:", mosque.name, mosque.city);
  await p.$disconnect();
}
main().catch(console.error);
