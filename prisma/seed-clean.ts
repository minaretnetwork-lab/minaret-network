import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

const prisma = new PrismaClient();

const publicSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/+$/, "");
const adminSupabaseUrl = (process.env.SUPABASE_INTERNAL_URL?.trim() || publicSupabaseUrl)?.replace(/\/+$/, "");
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

function requireCleanConfirmation() {
  if (process.env.CONFIRM_CLEAN_DATABASE !== "YES") {
    throw new Error("Refusing to clean the database without CONFIRM_CLEAN_DATABASE=YES.");
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is required.");

  const parsed = new URL(databaseUrl);
  if (!["127.0.0.1", "localhost"].includes(parsed.hostname)) {
    throw new Error(`Refusing to clean non-loopback database host: ${parsed.hostname}`);
  }
}

async function deleteAuthUsers() {
  if (!adminSupabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase admin URL and service-role key are required to clean auth users.");
  }

  const admin = createClient(adminSupabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (error) throw error;
    const users = data.users ?? [];
    if (users.length === 0) break;

    for (const user of users) {
      const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
      if (deleteError) throw deleteError;
    }
  }
}

async function cleanPublicTables() {
  await prisma.$transaction([
    prisma.analyticsEvent.deleteMany(),
    prisma.message.deleteMany(),
    prisma.conversation.deleteMany(),
    prisma.categorySuggestion.deleteMany(),
    prisma.serviceRequest.deleteMany(),
    prisma.featuredWaitlist.deleteMany(),
    prisma.featuredListing.deleteMany(),
    prisma.featuredPricingTier.deleteMany(),
    prisma.sponsoredWaitlist.deleteMany(),
    prisma.sponsoredListing.deleteMany(),
    prisma.sponsoredPricingTier.deleteMany(),
    prisma.recommendation.deleteMany(),
    prisma.galleryImage.deleteMany(),
    prisma.credential.deleteMany(),
    prisma.verificationBadge.deleteMany(),
    prisma.professional.deleteMany(),
    prisma.user.deleteMany(),
    prisma.serviceArea.deleteMany(),
    prisma.category.deleteMany(),
    prisma.mosque.deleteMany(),
  ]);
}

async function seedSystemData() {
  const { CATEGORIES, SERVICE_AREAS } = await import("../src/lib/constants");

  const mosque = await prisma.mosque.create({
    data: {
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

  for (const cat of CATEGORIES) {
    await prisma.category.create({
      data: {
        name: cat.name,
        slug: cat.slug,
        icon: cat.icon,
        mosqueId: mosque.id,
        isActive: true,
      },
    });
  }

  for (const area of SERVICE_AREAS) {
    await prisma.serviceArea.create({
      data: {
        name: area.name,
        slug: area.slug,
        province: "Ontario",
        country: "Canada",
        mosqueId: mosque.id,
      },
    });
  }

  await prisma.sponsoredPricingTier.create({
    data: {
      name: "Default",
      priceMonthly: 49,
      maxSlots: 2,
      categoryId: null,
      serviceAreaId: null,
      isActive: true,
    },
  });

  await prisma.featuredPricingTier.create({
    data: {
      name: "Default",
      priceMonthly: 99,
      maxSlots: 6,
      city: null,
      isActive: true,
    },
  });
}

async function main() {
  requireCleanConfirmation();
  await deleteAuthUsers();
  await cleanPublicTables();
  await seedSystemData();
  console.log("Clean database seed complete.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
