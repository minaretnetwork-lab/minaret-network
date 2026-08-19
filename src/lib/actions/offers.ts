"use server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { REGION_MAP } from "@/lib/constants";
import { getPriceForDays, getTierFromDays } from "@/lib/offers/pricing";

export async function uploadOfferImage(formData: FormData): Promise<string> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const file = formData.get("file") as File;
  if (!file || !file.size) throw new Error("No file provided");
  if (file.size > 5 * 1024 * 1024) throw new Error("Image must be under 5MB");
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new Error("Only JPEG, PNG, or WebP images are allowed");

  const ext = file.type.split("/")[1];
  const path = `${user.id}/${Date.now()}.${ext}`;

  const admin = createAdminClient();
  const { error: bucketErr } = await admin.storage.createBucket("offer-images", {
    public: true,
    fileSizeLimit: 5242880,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  });
  if (bucketErr && !bucketErr.message.includes("already exists")) throw bucketErr;

  const { error: uploadErr } = await admin.storage.from("offer-images").upload(path, file, { upsert: true, contentType: file.type });
  if (uploadErr) throw uploadErr;

  const { data } = admin.storage.from("offer-images").getPublicUrl(path);
  return `${data.publicUrl}?t=${Date.now()}`;
}

// ── Public: homepage & browse ─────────────────────────────────────────────────

export async function getActiveOffersForHomepage(region?: string) {
  const now = new Date();
  return prisma.communityOffer.findMany({
    where: {
      status: "ACTIVE",
      startDate: { lte: now },
      expiresAt: { gt: now },
      ...(region ? { region } : {}),
    },
    orderBy: [
      { tier: "desc" },  // FEATURED > STANDARD > WEEKEND alphabetically desc
      { expiresAt: "asc" },
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

export async function getActiveOffers({
  limit = 24,
  cursor,
  region,
}: { limit?: number; cursor?: string; region?: string } = {}) {
  const now = new Date();
  return prisma.communityOffer.findMany({
    where: {
      status: "ACTIVE",
      startDate: { lte: now },
      expiresAt: { gt: now },
      ...(region ? { region } : {}),
    },
    orderBy: [{ tier: "desc" }, { expiresAt: "asc" }],
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
  startDate: string; // ISO date string "YYYY-MM-DD"
  endDate: string;   // ISO date string "YYYY-MM-DD"
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: {
      professionals: {
        where: { status: "APPROVED" },
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { serviceAreas: { select: { slug: true }, take: 5 } },
      },
    },
  });
  const professional = dbUser?.professionals[0];
  if (!professional) throw new Error("Only approved professionals can post Community Offers");

  // Parse and validate dates
  const startDate = new Date(data.startDate + "T00:00:00");
  const endDate = new Date(data.endDate + "T23:59:59");
  const today = new Date(); today.setHours(0, 0, 0, 0);

  if (startDate < today) throw new Error("Start date cannot be in the past");
  if (endDate <= startDate) throw new Error("End date must be after start date");

  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  if (days > 30) throw new Error("Maximum offer duration is 30 days");

  const tier = getTierFromDays(days);
  const price = getPriceForDays(days);

  // Derive region from service areas
  const region = professional.serviceAreas
    .map((a) => REGION_MAP[a.slug])
    .find(Boolean) ?? "Beyond GTA";

  await prisma.communityOffer.create({
    data: {
      professionalId: professional.id,
      title: data.title,
      description: data.description,
      imageUrl: data.imageUrl ?? null,
      tier,
      region,
      price,
      status: "PENDING",
      startDate,
      expiresAt: endDate,
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

  await prisma.communityOffer.update({ where: { id: offerId }, data: { status: "CANCELLED" } });

  revalidatePath("/dashboard/offers");
  revalidatePath("/");
}

// ── Admin ─────────────────────────────────────────────────────────────────────

export async function getOffersForAdmin() {
  const [pending, active, recent] = await Promise.all([
    prisma.communityOffer.findMany({
      where: { status: "PENDING" },
      include: offerInclude,
      orderBy: { startDate: "asc" },
    }),
    prisma.communityOffer.findMany({
      where: { status: "ACTIVE" },
      include: offerInclude,
      orderBy: [{ tier: "desc" }, { expiresAt: "asc" }],
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
  if (!offer.startDate || !offer.expiresAt) throw new Error("Offer is missing date range");

  // Warn if the offer window has already passed
  if (offer.expiresAt < new Date()) throw new Error("This offer's end date has already passed — ask the professional to resubmit with new dates");

  await prisma.communityOffer.update({
    where: { id: offerId },
    data: { status: "ACTIVE", adminNote: null },
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
