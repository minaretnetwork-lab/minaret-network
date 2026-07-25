"use server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ── Pricing tier resolution ───────────────────────────────────────────────────

async function getApplicablePricingTier(categoryId: string, serviceAreaId: string) {
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

export async function getSponsoredSlotAvailability(categoryId: string, serviceAreaId: string) {
  const tier = await getApplicablePricingTier(categoryId, serviceAreaId);
  const maxSlots = tier?.maxSlots ?? 2;
  const priceMonthly = Number(tier?.priceMonthly ?? 49);

  const activeCount = await prisma.sponsoredListing.count({
    where: { categoryId, serviceAreaId, status: "ACTIVE" },
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
      professional: {
        include: {
          category: { select: { id: true, name: true, slug: true, icon: true } },
          serviceAreas: { select: { id: true, name: true } },
        },
      },
    },
  });
  if (!dbUser?.professional) return null;

  const professionalId = dbUser.professional.id;

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

  return { listings, waitlist, professional: dbUser.professional };
}

// ── Business dashboard: apply / cancel / leave waitlist ───────────────────────

export async function applyForSponsorship(categoryId: string, serviceAreaId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: { professional: true },
  });
  if (!dbUser?.professional) throw new Error("No professional profile found");
  if (dbUser.professional.status !== "APPROVED") throw new Error("Your profile must be approved before applying for a sponsored listing");

  const professionalId = dbUser.professional.id;

  const existing = await prisma.sponsoredListing.findFirst({
    where: { professionalId, categoryId, serviceAreaId, status: { in: ["ACTIVE", "PENDING"] } },
  });
  if (existing) throw new Error("You already have an active or pending application for this slot");

  const { available, priceMonthly, pricingTierId, maxSlots } = await getSponsoredSlotAvailability(categoryId, serviceAreaId);

  if (!available) {
    await prisma.sponsoredWaitlist.upsert({
      where: { professionalId_categoryId_serviceAreaId: { professionalId, categoryId, serviceAreaId } },
      update: {},
      create: { professionalId, categoryId, serviceAreaId },
    });
    revalidatePath("/dashboard/promote");
    return { status: "waitlisted" as const, maxSlots };
  }

  await prisma.sponsoredListing.create({
    data: { professionalId, categoryId, serviceAreaId, pricingTierId, priceMonthly, status: "PENDING" },
  });

  revalidatePath("/dashboard/promote");
  return { status: "applied" as const };
}

export async function cancelMySponsorship(listingId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: { professional: true },
  });
  if (!dbUser?.professional) throw new Error("No professional profile found");

  const listing = await prisma.sponsoredListing.findFirst({
    where: { id: listingId, professionalId: dbUser.professional.id },
  });
  if (!listing) throw new Error("Listing not found");

  await prisma.sponsoredListing.update({
    where: { id: listingId },
    data: { status: "CANCELLED", cancelledAt: new Date() },
  });

  if (listing.status === "ACTIVE") {
    await syncIsSponsored(listing.professionalId);
    await notifyWaitlist(listing.categoryId, listing.serviceAreaId);
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
    include: { professional: true },
  });
  if (!dbUser?.professional) throw new Error("No professional profile found");

  await prisma.sponsoredWaitlist.deleteMany({
    where: { professionalId: dbUser.professional.id, categoryId, serviceAreaId },
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

  const tier = await getApplicablePricingTier(listing.categoryId, listing.serviceAreaId);
  const maxSlots = tier?.maxSlots ?? 2;

  const activeCount = await prisma.sponsoredListing.count({
    where: { categoryId: listing.categoryId, serviceAreaId: listing.serviceAreaId, status: "ACTIVE", id: { not: listingId } },
  });
  if (activeCount >= maxSlots) throw new Error(`Slot full — max ${maxSlots} active sponsored listings for this combination`);

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
    await notifyWaitlist(listing.categoryId, listing.serviceAreaId);
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

export async function incrementContactClick(professionalId: string) {
  await prisma.professional.update({
    where: { id: professionalId },
    data: { contactClicks: { increment: 1 } },
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

async function notifyWaitlist(categoryId: string, serviceAreaId: string) {
  const first = await prisma.sponsoredWaitlist.findFirst({
    where: { categoryId, serviceAreaId, notifiedAt: null },
    orderBy: { createdAt: "asc" },
  });
  if (first) {
    await prisma.sponsoredWaitlist.update({
      where: { id: first.id },
      data: { notifiedAt: new Date() },
    });
  }
}
