"use server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { REGION_MAP } from "@/lib/constants";

const SPONSORED_MAX_SLOTS = 3; // per category per region

// ── Pricing tier resolution ───────────────────────────────────────────────────

async function getApplicablePricingTier(categoryId: string, serviceAreaId: string | null) {
  const exact = await prisma.sponsoredPricingTier.findFirst({
    where: { categoryId, serviceAreaId, isActive: true },
  });
  if (exact) return exact;

  const catOnly = await prisma.sponsoredPricingTier.findFirst({
    where: { categoryId, serviceAreaId: null, isActive: true },
  });
  if (catOnly) return catOnly;

  return prisma.sponsoredPricingTier.findFirst({
    where: { categoryId: null, serviceAreaId: null, isActive: true },
  });
}

// ── Public: slot availability ─────────────────────────────────────────────────

export async function getSponsoredSlotAvailability(categoryId: string, region: string) {
  const tier = await getApplicablePricingTier(categoryId, null);
  const maxSlots = SPONSORED_MAX_SLOTS;
  const priceMonthly = Number(tier?.priceMonthly ?? 19.99);

  const activeCount = await prisma.sponsoredListing.count({
    where: { categoryId, region, status: "ACTIVE" },
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

export async function getMySponsorship() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: {
      professionals: {
        include: {
          category: { select: { id: true, name: true, slug: true, icon: true } },
          serviceAreas: { select: { id: true, name: true, slug: true } },
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
    prisma.sponsoredListing.findMany({
      where: { professionalId, status: { in: ["ACTIVE", "PENDING", "REJECTED"] } },
      include: {
        category: { select: { id: true, name: true, slug: true, icon: true } },
        serviceArea: { select: { id: true, name: true } },
        pricingTier: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.sponsoredWaitlist.findMany({
      where: { professionalId },
      include: {
        category: { select: { id: true, name: true, slug: true, icon: true } },
        serviceArea: { select: { id: true, name: true } },
      },
    }),
  ]);

  return { listings, waitlist, professional };
}

// ── Business dashboard: apply / cancel / leave waitlist ───────────────────────

export async function applyForSponsorship(categoryId: string, serviceAreaId: string) {
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

  // Derive region from service area slug
  const serviceArea = await prisma.serviceArea.findUnique({ where: { id: serviceAreaId }, select: { slug: true, name: true } });
  if (!serviceArea) throw new Error("Service area not found");
  const region = REGION_MAP[serviceArea.slug] ?? "Beyond GTA";

  const existing = await prisma.sponsoredListing.findFirst({
    where: { professionalId, categoryId, region, status: { in: ["ACTIVE", "PENDING"] } },
  });
  if (existing) throw new Error(`You already have an active or pending sponsored listing in the ${region} region for this category`);

  // During the free-offer period (until Oct 31 2026), one approved listing per business total.
  const FREE_PERIOD_END = new Date("2026-11-01T00:00:00.000Z");
  if (new Date() < FREE_PERIOD_END) {
    const previouslyApproved = await prisma.sponsoredListing.findFirst({
      where: { professionalId, startDate: { not: null } },
    });
    if (previouslyApproved) {
      throw new Error(
        "During our free launch offer (until Oct 31, 2026), each business may only use one Sponsored Listing placement. You can reapply starting November 1, 2026."
      );
    }
  }

  const { available, priceMonthly, pricingTierId, maxSlots } = await getSponsoredSlotAvailability(categoryId, region);

  if (!available) {
    await prisma.sponsoredWaitlist.upsert({
      where: { professionalId_categoryId_serviceAreaId: { professionalId, categoryId, serviceAreaId } },
      update: {},
      create: { professionalId, categoryId, serviceAreaId },
    });
    revalidatePath("/dashboard/promote");
    return { status: "waitlisted" as const, maxSlots, region };
  }

  await prisma.sponsoredListing.create({
    data: { professionalId, categoryId, serviceAreaId, region, pricingTierId, priceMonthly, status: "PENDING" },
  });

  revalidatePath("/dashboard/promote");

  const { sendAdminSponsoredApplicationEmail } = await import("@/lib/email");
  const professionalName = professional.businessName ?? dbUser?.displayName ?? dbUser?.firstName ?? "Unknown";
  prisma.category.findUnique({ where: { id: categoryId }, select: { name: true } }).then((cat) => {
    sendAdminSponsoredApplicationEmail(professionalName, cat?.name ?? categoryId, serviceArea.name).catch(console.error);
  }).catch(console.error);

  return { status: "applied" as const, region };
}

export async function cancelMySponsorship(listingId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: { professionals: { select: { id: true }, orderBy: { createdAt: "desc" } } },
  });
  if (!dbUser?.professionals.length) throw new Error("No professional profile found");

  const listing = await prisma.sponsoredListing.findFirst({
    where: { id: listingId, professionalId: { in: dbUser.professionals.map((p) => p.id) } },
  });
  if (!listing) throw new Error("Listing not found");

  await prisma.sponsoredListing.update({
    where: { id: listingId },
    data: { status: "CANCELLED", cancelledAt: new Date() },
  });

  if (listing.status === "ACTIVE") {
    await syncIsSponsored(listing.professionalId);
    await notifyWaitlist(listing.categoryId, listing.serviceAreaId, listing.region ?? undefined);
  }

  revalidatePath("/dashboard/promote");
  revalidatePath("/professionals");
}

export async function removeFromWaitlist(categoryId: string, serviceAreaId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: { professionals: { select: { id: true }, orderBy: { createdAt: "desc" }, take: 1 } },
  });
  const professional = dbUser?.professionals[0];
  if (!professional) throw new Error("No professional profile found");

  await prisma.sponsoredWaitlist.deleteMany({
    where: { professionalId: professional.id, categoryId, serviceAreaId },
  });
  revalidatePath("/dashboard/promote");
}

// ── Admin: fetch ──────────────────────────────────────────────────────────────

export async function getSponsoredListingsForAdmin() {
  const [pending, active, waitlist, tiers] = await Promise.all([
    prisma.sponsoredListing.findMany({
      where: { status: "PENDING" },
      include: sponsoredInclude,
      orderBy: { createdAt: "asc" },
    }),
    prisma.sponsoredListing.findMany({
      where: { status: "ACTIVE" },
      include: sponsoredInclude,
      orderBy: { startDate: "desc" },
    }),
    prisma.sponsoredWaitlist.findMany({
      include: {
        professional: { include: { user: { select: { firstName: true, lastName: true, displayName: true, email: true } } } },
        category: { select: { id: true, name: true, slug: true, icon: true } },
        serviceArea: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.sponsoredPricingTier.findMany({
      include: {
        category: { select: { id: true, name: true } },
        serviceArea: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
  ]);
  return { pending, active, waitlist, tiers };
}

const sponsoredInclude = {
  professional: {
    include: {
      user: { select: { firstName: true, lastName: true, displayName: true, email: true } },
    },
  },
  category: { select: { id: true, name: true, slug: true, icon: true } },
  serviceArea: { select: { id: true, name: true } },
  pricingTier: true,
} as const;

// ── Admin: approve / reject / cancel ─────────────────────────────────────────

export async function approveSponsoredListing(listingId: string) {
  const listing = await prisma.sponsoredListing.findUnique({ where: { id: listingId } });
  if (!listing) throw new Error("Listing not found");

  // Ensure region is set (backfill for listings created before region was added)
  if (!listing.region) {
    const serviceArea = await prisma.serviceArea.findUnique({ where: { id: listing.serviceAreaId }, select: { slug: true } });
    const region = serviceArea ? (REGION_MAP[serviceArea.slug] ?? "Beyond GTA") : "Beyond GTA";
    await prisma.sponsoredListing.update({ where: { id: listingId }, data: { region } });
    listing.region = region;
  }

  const activeCount = await prisma.sponsoredListing.count({
    where: { categoryId: listing.categoryId, region: listing.region, status: "ACTIVE", id: { not: listingId } },
  });
  if (activeCount >= SPONSORED_MAX_SLOTS) throw new Error(`Slot full — max ${SPONSORED_MAX_SLOTS} active sponsored listings in the ${listing.region} region for this category`);

  await prisma.sponsoredListing.update({
    where: { id: listingId },
    data: { status: "ACTIVE", startDate: new Date(), adminNote: null },
  });

  await syncIsSponsored(listing.professionalId);
  revalidatePath("/admin/sponsored");
  revalidatePath("/professionals");
}

export async function rejectSponsoredListing(listingId: string, note: string) {
  await prisma.sponsoredListing.update({
    where: { id: listingId },
    data: { status: "REJECTED", adminNote: note },
  });
  revalidatePath("/admin/sponsored");
}

export async function cancelSponsoredListingAdmin(listingId: string, note?: string) {
  const listing = await prisma.sponsoredListing.findUnique({ where: { id: listingId } });
  if (!listing) throw new Error("Listing not found");

  await prisma.sponsoredListing.update({
    where: { id: listingId },
    data: { status: "CANCELLED", cancelledAt: new Date(), ...(note && { adminNote: note }) },
  });

  if (listing.status === "ACTIVE") {
    await syncIsSponsored(listing.professionalId);
    await notifyWaitlist(listing.categoryId, listing.serviceAreaId, listing.region ?? undefined);
  }

  revalidatePath("/admin/sponsored");
  revalidatePath("/professionals");
}

// ── Admin: pricing tiers ──────────────────────────────────────────────────────

export async function createPricingTier(data: {
  name: string;
  priceMonthly: number;
  maxSlots: number;
  categoryId?: string | null;
  serviceAreaId?: string | null;
}) {
  await prisma.sponsoredPricingTier.create({
    data: {
      name: data.name,
      priceMonthly: data.priceMonthly,
      maxSlots: data.maxSlots,
      categoryId: data.categoryId ?? null,
      serviceAreaId: data.serviceAreaId ?? null,
    },
  });
  revalidatePath("/admin/sponsored");
}

export async function updatePricingTier(id: string, data: {
  name?: string;
  priceMonthly?: number;
  maxSlots?: number;
  isActive?: boolean;
}) {
  await prisma.sponsoredPricingTier.update({ where: { id }, data });
  revalidatePath("/admin/sponsored");
}

// ── Analytics ─────────────────────────────────────────────────────────────────

export async function incrementContactClick(professionalId: string, type: "phone" | "email" | "whatsapp") {
  const field = type === "phone" ? "phoneClicks" : type === "email" ? "emailClicks" : "whatsappClicks";
  await prisma.professional.update({
    where: { id: professionalId },
    data: { contactClicks: { increment: 1 }, [field]: { increment: 1 } },
  });
}

// ── Internal helpers ──────────────────────────────────────────────────────────

async function syncIsSponsored(professionalId: string) {
  const hasActive = await prisma.sponsoredListing.count({
    where: { professionalId, status: "ACTIVE" },
  });
  await prisma.professional.update({
    where: { id: professionalId },
    data: { isSponsored: hasActive > 0 },
  });
}

async function notifyWaitlist(categoryId: string, serviceAreaId: string, region?: string) {
  // Notify by region if available, otherwise fall back to service area
  const where = region
    ? { categoryId, notifiedAt: null, serviceArea: { slug: { in: Object.entries(REGION_MAP).filter(([, r]) => r === region).map(([s]) => s) } } }
    : { categoryId, serviceAreaId, notifiedAt: null };
  const first = await prisma.sponsoredWaitlist.findFirst({
    where,
    orderBy: { createdAt: "asc" },
  });
  if (first) {
    await prisma.sponsoredWaitlist.update({
      where: { id: first.id },
      data: { notifiedAt: new Date() },
    });
  }
}
