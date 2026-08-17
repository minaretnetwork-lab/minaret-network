"use server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const FEATURED_MAX_SLOTS = 6; // GTA-wide

// ── Pricing tier resolution ───────────────────────────────────────────────────

async function getApplicableFeaturedTier() {
  return prisma.featuredPricingTier.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
  });
}

// ── Public: homepage ──────────────────────────────────────────────────────────

export async function getFeaturedBusinessesForHomepage(city?: string) {
  return prisma.featuredListing.findMany({
    where: {
      status: "ACTIVE",
      professional: { status: "APPROVED" },
      ...(city ? { city } : {}),
    },
    take: 12,
    orderBy: [{ displayOrder: "asc" }, { startDate: "asc" }, { createdAt: "asc" }],
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

export async function getFeaturedSlotAvailability() {
  const tier = await getApplicableFeaturedTier();
  const maxSlots = FEATURED_MAX_SLOTS;
  const priceMonthly = Number(tier?.priceMonthly ?? 29.99);

  const activeCount = await prisma.featuredListing.count({
    where: { status: "ACTIVE" },
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

export async function applyForFeatured() {
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
    where: { professionalId, status: { in: ["ACTIVE", "PENDING"] } },
  });
  if (existing) throw new Error("You already have an active or pending Featured Business application");

  // During the free-offer period (until Oct 31 2026), one approved listing per business total.
  const FREE_PERIOD_END = new Date("2026-11-01T00:00:00.000Z");
  if (new Date() < FREE_PERIOD_END) {
    const previouslyApproved = await prisma.featuredListing.findFirst({
      where: { professionalId, startDate: { not: null } },
    });
    if (previouslyApproved) {
      throw new Error(
        "During our free launch offer (until Oct 31, 2026), each business may only use one Featured Business placement. You can reapply starting November 1, 2026."
      );
    }
  }

  const { available, priceMonthly, pricingTierId, maxSlots } = await getFeaturedSlotAvailability();

  if (!available) {
    await prisma.featuredWaitlist.upsert({
      where: { professionalId_city: { professionalId, city: "GTA" } },
      update: {},
      create: { professionalId, city: "GTA" },
    });
    revalidatePath("/dashboard/featured");
    return { status: "waitlisted" as const, maxSlots };
  }

  await prisma.featuredListing.create({
    data: { professionalId, city: "GTA", pricingTierId, priceMonthly, status: "PENDING" },
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
    await notifyFeaturedWaitlist();
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
      orderBy: [{ displayOrder: "asc" }, { startDate: "asc" }, { createdAt: "asc" }],
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

  const activeCount = await prisma.featuredListing.count({
    where: { status: "ACTIVE", id: { not: listingId } },
  });
  if (activeCount >= FEATURED_MAX_SLOTS) throw new Error(`GTA slots full — max ${FEATURED_MAX_SLOTS} Featured Business listings at a time`);

  const nextDisplayOrder = await getNextFeaturedDisplayOrder();
  await prisma.featuredListing.update({
    where: { id: listingId },
    data: {
      status: "ACTIVE",
      startDate: new Date(),
      adminNote: null,
      displayOrder: listing.displayOrder > 0 ? listing.displayOrder : nextDisplayOrder,
    },
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
    await notifyFeaturedWaitlist();
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

async function notifyFeaturedWaitlist() {
  const first = await prisma.featuredWaitlist.findFirst({
    where: { notifiedAt: null },
    orderBy: { createdAt: "asc" },
  });
  if (first) {
    await prisma.featuredWaitlist.update({
      where: { id: first.id },
      data: { notifiedAt: new Date() },
    });
  }
}

async function getNextFeaturedDisplayOrder() {
  const last = await prisma.featuredListing.findFirst({
    where: { status: "ACTIVE", displayOrder: { gt: 0 } },
    select: { displayOrder: true },
    orderBy: { displayOrder: "desc" },
  });
  return (last?.displayOrder ?? 0) + 1;
}
