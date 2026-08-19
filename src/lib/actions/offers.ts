"use server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ── Pricing ───────────────────────────────────────────────────────────────────

export const OFFER_TIERS = {
  WEEKEND: { label: "Weekend", days: 3, price: 4.99, description: "3 days" },
  STANDARD: { label: "Standard", days: 7, price: 9.99, description: "1 week" },
  FEATURED: { label: "Featured", days: 30, price: 19.99, description: "1 month — always shown first" },
} as const;

export type OfferTierKey = keyof typeof OFFER_TIERS;

// ── Public: homepage & browse ─────────────────────────────────────────────────

export async function getActiveOffersForHomepage() {
  const now = new Date();
  return prisma.communityOffer.findMany({
    where: { status: "ACTIVE", expiresAt: { gt: now } },
    orderBy: [
      { tier: "desc" },    // FEATURED sorts last alphabetically → use custom sort client-side
      { startDate: "asc" },
    ],
    take: 9,
    include: {
      professional: {
        include: {
          user: { select: { firstName: true, lastName: true, displayName: true, avatarUrl: true } },
          category: { select: { name: true, slug: true, icon: true } },
        },
      },
    },
  });
}

export async function getActiveOffers({ limit = 24, cursor }: { limit?: number; cursor?: string } = {}) {
  const now = new Date();
  return prisma.communityOffer.findMany({
    where: { status: "ACTIVE", expiresAt: { gt: now } },
    orderBy: [{ tier: "desc" }, { startDate: "asc" }],
    take: limit,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    include: {
      professional: {
        include: {
          user: { select: { firstName: true, lastName: true, displayName: true, avatarUrl: true } },
          category: { select: { name: true, slug: true, icon: true } },
        },
      },
    },
  });
}

// ── Dashboard: my offers ──────────────────────────────────────────────────────

export async function getMyOffers() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: {
      professionals: {
        where: { status: "APPROVED" },
        orderBy: { createdAt: "desc" },
        take: 1,
        include: {
          user: { select: { phone: true, whatsapp: true } },
        },
      },
    },
  });
  const professional = dbUser?.professionals[0];
  if (!professional) return null;

  const offers = await prisma.communityOffer.findMany({
    where: { professionalId: professional.id },
    orderBy: { createdAt: "desc" },
  });

  return { offers, professional };
}

// ── Dashboard: submit offer ───────────────────────────────────────────────────

export async function submitOffer(data: {
  title: string;
  description: string;
  imageUrl?: string;
  tier: OfferTierKey;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: { professionals: { where: { status: "APPROVED" }, orderBy: { createdAt: "desc" }, take: 1 } },
  });
  const professional = dbUser?.professionals[0];
  if (!professional) throw new Error("Only approved professionals can post Community Offers");

  const { days, price } = OFFER_TIERS[data.tier];

  await prisma.communityOffer.create({
    data: {
      professionalId: professional.id,
      title: data.title,
      description: data.description,
      imageUrl: data.imageUrl ?? null,
      tier: data.tier,
      price,
      status: "PENDING",
      // expiresAt set when admin approves (or auto-approve post Nov 1 2026)
      expiresAt: null,
      startDate: null,
      // store days as a hint for admin
      adminNote: `${days}-day ${data.tier} offer submitted`,
    },
  });

  revalidatePath("/dashboard/offers");
  return { success: true };
}

export async function cancelMyOffer(offerId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: { professionals: { select: { id: true }, orderBy: { createdAt: "desc" } } },
  });
  if (!dbUser?.professionals.length) throw new Error("No professional profile found");

  const offer = await prisma.communityOffer.findFirst({
    where: { id: offerId, professionalId: { in: dbUser.professionals.map((p) => p.id) } },
  });
  if (!offer) throw new Error("Offer not found");
  if (!["PENDING", "ACTIVE"].includes(offer.status)) throw new Error("Cannot cancel this offer");

  await prisma.communityOffer.update({
    where: { id: offerId },
    data: { status: "CANCELLED" },
  });

  revalidatePath("/dashboard/offers");
  revalidatePath("/");
}

// ── Admin ─────────────────────────────────────────────────────────────────────

export async function getOffersForAdmin() {
  const [pending, active, recent] = await Promise.all([
    prisma.communityOffer.findMany({
      where: { status: "PENDING" },
      include: offerInclude,
      orderBy: { createdAt: "asc" },
    }),
    prisma.communityOffer.findMany({
      where: { status: "ACTIVE" },
      include: offerInclude,
      orderBy: [{ tier: "desc" }, { startDate: "asc" }],
    }),
    prisma.communityOffer.findMany({
      where: { status: { in: ["REJECTED", "EXPIRED", "CANCELLED"] } },
      include: offerInclude,
      orderBy: { updatedAt: "desc" },
      take: 20,
    }),
  ]);
  return { pending, active, recent };
}

export async function approveOffer(offerId: string) {
  const offer = await prisma.communityOffer.findUnique({ where: { id: offerId } });
  if (!offer) throw new Error("Offer not found");

  const { days } = OFFER_TIERS[offer.tier as OfferTierKey];
  const now = new Date();
  const expiresAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  await prisma.communityOffer.update({
    where: { id: offerId },
    data: { status: "ACTIVE", startDate: now, expiresAt, adminNote: null },
  });

  revalidatePath("/admin/offers");
  revalidatePath("/");
}

export async function rejectOffer(offerId: string, note: string) {
  await prisma.communityOffer.update({
    where: { id: offerId },
    data: { status: "REJECTED", adminNote: note },
  });
  revalidatePath("/admin/offers");
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const offerInclude = {
  professional: {
    include: {
      user: { select: { firstName: true, lastName: true, displayName: true, email: true, phone: true, whatsapp: true } },
      category: { select: { name: true, slug: true, icon: true } },
    },
  },
} as const;
