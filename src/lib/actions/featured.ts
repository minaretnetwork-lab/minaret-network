"use server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ── Pricing tier resolution ───────────────────────────────────────────────────

async function getApplicableFeaturedTier(city: string) {
  const cityTier = await prisma.featuredPricingTier.findFirst({
    where: { city, isActive: true },
  });
  if (cityTier) return cityTier;

  return prisma.featuredPricingTier.findFirst({
    where: { city: null, isActive: true },
  });
}

// ── Public: homepage ──────────────────────────────────────────────────────────

export async function getFeaturedBusinessesForHomepage(city?: string) {
  return prisma.featuredListing.findMany({
    where: {
      status: "ACTIVE",
      ...(city ? { city } : {}),
    },
    take: 6,
    orderBy: { startDate: "desc" },
    include: {
      professional: {
        include: {
          user: { select: { firstName: true, lastName: true, displayName: true, avatarUrl: true } },
          category: { select: { id: true, name: true, slug: true, icon: true } },
          mosque: { select: { id: true, name: true } },
          badges: { select: { id: true, type: true } },
        },
      },
    },
  });
}

export async function getActiveFeaturedCities() {
  const listings = await prisma.featuredListing.findMany({
    where: { status: "ACTIVE" },
    select: { city: true },
    distinct: ["city"],
    orderBy: { city: "asc" },
  });
  return listings.map((l) => l.city);
}

// ── Slot availability ─────────────────────────────────────────────────────────

export async function getFeaturedSlotAvailability(city: string) {
  const tier = await getApplicableFeaturedTier(city);
  const maxSlots = tier?.maxSlots ?? 6;
  const priceMonthly = Number(tier?.priceMonthly ?? 99);

  const activeCount = await prisma.featuredListing.count({
    where: { city, status: "ACTIVE" },
  });

  return {
    available: activeCount < maxSlots,
    activeCount,
    maxSlots,
    priceMonthly,
    pricingTierId: tier?.id ?? null,
  };
}

// ── Business dashboard: fetch ─────────────────────────────────────────────────

export async function getMyFeaturedListings() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: {
      professionals: {
        include: {
          category: { select: { id: true, name: true, slug: true, icon: true } },
          serviceAreas: { select: { id: true, name: true } },
          mosque: { select: { city: true } },
        },
        where: { status: "APPROVED" },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });
  const professional = dbUser?.professionals[0];
  if (!professional) return null;

  const professionalId = professional.id;

  const [listings, waitlist] = await Promise.all([
    prisma.featuredListing.findMany({
      where: { professionalId, status: { in: ["ACTIVE", "PENDING", "REJECTED"] } },
      include: { pricingTier: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.featuredWaitlist.findMany({
      where: { professionalId },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return { listings, waitlist, professional };
}

// ── Business dashboard: apply / cancel ───────────────────────────────────────

export async function applyForFeatured(city: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: { professionals: { where: { status: "APPROVED" }, orderBy: { createdAt: "desc" }, take: 1 } },
  });
  const professional = dbUser?.professionals[0];
  if (!professional) throw new Error("No approved professional profile found");

  const professionalId = professional.id;

  const existing = await prisma.featuredListing.findFirst({
    where: { professionalId, city, status: { in: ["ACTIVE", "PENDING"] } },
  });
  if (existing) throw new Error("You already have an active or pending application for this city");

  const { available, priceMonthly, pricingTierId, maxSlots } = await getFeaturedSlotAvailability(city);

  if (!available) {
    await prisma.featuredWaitlist.upsert({
      where: { professionalId_city: { professionalId, city } },
      update: {},
      create: { professionalId, city },
    });
    revalidatePath("/dashboard/featured");
    return { status: "waitlisted" as const, maxSlots };
  }

  await prisma.featuredListing.create({
    data: { professionalId, city, pricingTierId, priceMonthly, status: "PENDING" },
  });

  revalidatePath("/dashboard/featured");
  return { status: "applied" as const };
}

export async function cancelMyFeaturedListing(listingId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: { professionals: { select: { id: true }, orderBy: { createdAt: "desc" } } },
  });
  if (!dbUser?.professionals.length) throw new Error("No professional profile found");

  const listing = await prisma.featuredListing.findFirst({
    where: { id: listingId, professionalId: { in: dbUser.professionals.map((p) => p.id) } },
  });
  if (!listing) throw new Error("Listing not found");

  await prisma.featuredListing.update({
    where: { id: listingId },
    data: { status: "CANCELLED", cancelledAt: new Date() },
  });

  if (listing.status === "ACTIVE") {
    await syncIsFeatured(listing.professionalId);
    await notifyFeaturedWaitlist(listing.city);
  }

  revalidatePath("/dashboard/featured");
  revalidatePath("/");
}

export async function leaveFeaturedWaitlist(city: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: { professionals: { select: { id: true }, orderBy: { createdAt: "desc" }, take: 1 } },
  });
  const professional = dbUser?.professionals[0];
  if (!professional) throw new Error("No professional profile found");

  await prisma.featuredWaitlist.deleteMany({
    where: { professionalId: professional.id, city },
  });
  revalidatePath("/dashboard/featured");
}

// ── Admin: fetch ──────────────────────────────────────────────────────────────

export async function getFeaturedListingsForAdmin() {
  const [pending, active, waitlist, tiers] = await Promise.all([
    prisma.featuredListing.findMany({
      where: { status: "PENDING" },
      include: featuredInclude,
      orderBy: { createdAt: "asc" },
    }),
    prisma.featuredListing.findMany({
      where: { status: "ACTIVE" },
      include: featuredInclude,
      orderBy: { startDate: "desc" },
    }),
    prisma.featuredWaitlist.findMany({
      include: {
        professional: {
          include: { user: { select: { firstName: true, lastName: true, displayName: true, email: true } } },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.featuredPricingTier.findMany({ orderBy: { createdAt: "asc" } }),
  ]);
  return { pending, active, waitlist, tiers };
}

const featuredInclude = {
  professional: {
    include: {
      user: { select: { firstName: true, lastName: true, displayName: true, email: true } },
      category: { select: { name: true, slug: true, icon: true } },
    },
  },
  pricingTier: true,
} as const;

// ── Admin: approve / reject / cancel ─────────────────────────────────────────

export async function approveFeaturedListing(listingId: string) {
  const listing = await prisma.featuredListing.findUnique({ where: { id: listingId } });
  if (!listing) throw new Error("Listing not found");

  const tier = await getApplicableFeaturedTier(listing.city);
  const maxSlots = tier?.maxSlots ?? 6;

  const activeCount = await prisma.featuredListing.count({
    where: { city: listing.city, status: "ACTIVE", id: { not: listingId } },
  });
  if (activeCount >= maxSlots) throw new Error(`Slots full for ${listing.city} — max ${maxSlots}`);

  await prisma.featuredListing.update({
    where: { id: listingId },
    data: { status: "ACTIVE", startDate: new Date(), adminNote: null },
  });

  await syncIsFeatured(listing.professionalId);
  revalidatePath("/admin/featured");
  revalidatePath("/");
}

export async function rejectFeaturedListing(listingId: string, note: string) {
  await prisma.featuredListing.update({
    where: { id: listingId },
    data: { status: "REJECTED", adminNote: note },
  });
  revalidatePath("/admin/featured");
}

export async function cancelFeaturedListingAdmin(listingId: string, note?: string) {
  const listing = await prisma.featuredListing.findUnique({ where: { id: listingId } });
  if (!listing) throw new Error("Listing not found");

  await prisma.featuredListing.update({
    where: { id: listingId },
    data: { status: "CANCELLED", cancelledAt: new Date(), ...(note && { adminNote: note }) },
  });

  if (listing.status === "ACTIVE") {
    await syncIsFeatured(listing.professionalId);
    await notifyFeaturedWaitlist(listing.city);
  }

  revalidatePath("/admin/featured");
  revalidatePath("/");
}

// ── Admin: pricing tiers ──────────────────────────────────────────────────────

export async function createFeaturedPricingTier(data: {
  name: string;
  city?: string | null;
  priceMonthly: number;
  maxSlots: number;
}) {
  await prisma.featuredPricingTier.create({
    data: {
      name: data.name,
      city: data.city ?? null,
      priceMonthly: data.priceMonthly,
      maxSlots: data.maxSlots,
    },
  });
  revalidatePath("/admin/featured");
}

export async function updateFeaturedPricingTier(id: string, data: {
  name?: string;
  priceMonthly?: number;
  maxSlots?: number;
  isActive?: boolean;
}) {
  await prisma.featuredPricingTier.update({ where: { id }, data });
  revalidatePath("/admin/featured");
}

// ── Analytics ─────────────────────────────────────────────────────────────────

export async function trackFeaturedImpression(listingId: string) {
  await prisma.featuredListing.update({
    where: { id: listingId },
    data: { impressions: { increment: 1 } },
  });
}

export async function trackFeaturedCardClick(listingId: string) {
  await prisma.featuredListing.update({
    where: { id: listingId },
    data: { cardClicks: { increment: 1 } },
  });
}

export async function trackFeaturedContactClick(listingId: string, type: "website" | "phone" | "whatsapp") {
  const field = type === "website" ? "websiteClicks" : type === "phone" ? "phoneClicks" : "whatsappClicks";
  await prisma.featuredListing.update({
    where: { id: listingId },
    data: { [field]: { increment: 1 } },
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function syncIsFeatured(professionalId: string) {
  const hasActive = await prisma.featuredListing.count({
    where: { professionalId, status: "ACTIVE" },
  });
  await prisma.professional.update({
    where: { id: professionalId },
    data: { isFeatured: hasActive > 0 },
  });
}

async function notifyFeaturedWaitlist(city: string) {
  const first = await prisma.featuredWaitlist.findFirst({
    where: { city, notifiedAt: null },
    orderBy: { createdAt: "asc" },
  });
  if (first) {
    await prisma.featuredWaitlist.update({
      where: { id: first.id },
      data: { notifiedAt: new Date() },
    });
  }
}
