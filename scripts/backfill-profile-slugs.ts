import { PrismaClient } from "@prisma/client";
import { buildBaseSlug, deduplicateSlug } from "../src/lib/seo/slug-utils";

const prisma = new PrismaClient();

async function main() {
  const professionals = await prisma.professional.findMany({
    where: { status: "APPROVED" },
    select: {
      id: true,
      profileSlug: true,
      businessName: true,
      title: true,
      user: { select: { firstName: true, lastName: true } },
      category: { select: { slug: true, name: true } },
      serviceAreas: { select: { slug: true, name: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  console.log(`Found ${professionals.length} approved professionals`);

  const usedSlugs = new Set<string>();
  const updates: { id: string; slug: string }[] = [];

  for (const pro of professionals) {
    if (pro.profileSlug) {
      usedSlugs.add(pro.profileSlug);
      console.log(`  SKIP ${pro.id}: already has slug "${pro.profileSlug}"`);
      continue;
    }
    const base = buildBaseSlug(pro);
    const slug = deduplicateSlug(base, usedSlugs);
    usedSlugs.add(slug);
    updates.push({ id: pro.id, slug });
    console.log(`  ${pro.id}: "${base}" → "${slug}"`);
  }

  console.log(`\nApplying ${updates.length} slug updates...`);
  for (const { id, slug } of updates) {
    await prisma.professional.update({
      where: { id },
      data: { profileSlug: slug },
    });
  }
  console.log("Done.");
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
