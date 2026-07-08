import { PrismaClient } from "@prisma/client";
import { CATEGORIES, SERVICE_AREAS } from "../src/lib/constants";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database…");

  // Create default mosque
  const mosque = await prisma.mosque.upsert({
    where: { slug: "al-falah" },
    update: {
      city: "Keswick",
      communityChannelType: "WhatsApp",
    },
    create: {
      name: "Al-Falah Mosque",
      slug: "al-falah",
      description: "Al-Falah Mosque Community",
      city: "Keswick",
      province: "Ontario",
      country: "Canada",
      communityChannelType: "WhatsApp",
      isActive: true,
    },
  });

  console.log(`✅ Mosque: ${mosque.name}`);

  // Seed categories
  for (const cat of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug_mosqueId: { slug: cat.slug, mosqueId: mosque.id } },
      update: { name: cat.name, icon: cat.icon, isActive: true },
      create: {
        name: cat.name,
        slug: cat.slug,
        icon: cat.icon,
        mosqueId: mosque.id,
        isActive: true,
      },
    });
  }

  console.log(`✅ ${CATEGORIES.length} categories seeded`);

  // Seed service areas
  for (const area of SERVICE_AREAS) {
    await prisma.serviceArea.upsert({
      where: { slug_mosqueId: { slug: area.slug, mosqueId: mosque.id } },
      update: { name: area.name },
      create: {
        name: area.name,
        slug: area.slug,
        province: "Ontario",
        country: "Canada",
        mosqueId: mosque.id,
      },
    });
  }

  console.log(`✅ ${SERVICE_AREAS.length} service areas seeded`);
  console.log("🎉 Seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
