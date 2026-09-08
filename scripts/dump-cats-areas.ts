import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
async function main() {
  const [cats, areas] = await Promise.all([
    p.category.findMany({ where: { isActive: true }, select: { name: true, slug: true }, orderBy: { name: "asc" } }),
    p.serviceArea.findMany({ select: { name: true, slug: true, city: true, province: true }, orderBy: { name: "asc" } }),
  ]);
  console.log("CATEGORIES:", JSON.stringify(cats, null, 2));
  console.log("SERVICE_AREAS:", JSON.stringify(areas, null, 2));
  await p.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
