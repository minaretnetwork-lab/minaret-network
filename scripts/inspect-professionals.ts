import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
async function main() {
  const pros = await p.professional.findMany({
    where: { status: "APPROVED" },
    select: {
      id: true,
      businessName: true,
      title: true,
      bio: true,
      businessAddress: true,
      category: { select: { name: true, slug: true } },
      serviceAreas: { select: { name: true, slug: true } },
      user: { select: { firstName: true, lastName: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  console.log(`Total APPROVED professionals: ${pros.length}`);
  for (const p of pros) {
    const name = p.businessName || `${p.user?.firstName ?? ""} ${p.user?.lastName ?? ""}`.trim() || "(no name)";
    const areas = p.serviceAreas.map((a) => a.name).join(", ") || "(none)";
    const hasBio = p.bio && p.bio.trim().length > 20;
    const hasAddress = !!p.businessAddress;
    console.log(`  [${p.category.slug}] ${name} | areas: ${areas} | bio: ${hasBio ? "yes" : "NO"} | address: ${hasAddress ? "yes" : "NO"}`);
  }

  // Count pros per area+category combo
  const combos: Record<string, number> = {};
  for (const pro of pros) {
    for (const area of pro.serviceAreas) {
      const key = `${pro.category.slug}|${area.slug}`;
      combos[key] = (combos[key] ?? 0) + 1;
    }
  }
  console.log("\nCategory+Area combos with >=1 professional:");
  Object.entries(combos).sort().forEach(([k, v]) => console.log(`  ${k}: ${v}`));

  await p.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
