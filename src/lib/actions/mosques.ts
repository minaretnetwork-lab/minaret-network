"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getMosques() {
  return prisma.mosque.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      city: true,
      address: true,
      website: true,
      communityChannelType: true,
      communityChannelName: true,
      communityChannelLink: true,
      isActive: true,
      _count: { select: { professionals: true } },
    },
  });
}

export async function getMosqueSuggestions() {
  return prisma.mosqueSuggestion.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      name: true,
      city: true,
      address: true,
      website: true,
      communityChannelType: true,
      communityChannelName: true,
      communityChannelLink: true,
      notes: true,
      status: true,
      createdAt: true,
      professionalId: true,
      requestedBy: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
    take: 25,
  });
}

function buildSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function buildUniqueMosqueSlug(name: string) {
  const base = buildSlug(name) || "mosque";
  let slug = base;
  let suffix = 2;

  while (await prisma.mosque.findFirst({ where: { slug }, select: { id: true } })) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }

  return slug;
}

export async function createMosque(data: {
  name: string;
  city?: string;
  address?: string;
  website?: string;
  communityChannelType?: string;
  communityChannelName?: string;
  communityChannelLink?: string;
}) {
  const slug = await buildUniqueMosqueSlug(data.name);

  await prisma.mosque.create({
    data: {
      name: data.name,
      slug,
      city: data.city || null,
      address: data.address || null,
      website: data.website || null,
      communityChannelType: data.communityChannelType || "WhatsApp",
      communityChannelName: data.communityChannelName || null,
      communityChannelLink: data.communityChannelLink || null,
    },
  });

  revalidatePath("/admin/mosques");
}

export async function approveMosqueSuggestion(id: string) {
  const suggestion = await prisma.mosqueSuggestion.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      city: true,
      address: true,
      website: true,
      communityChannelType: true,
      communityChannelName: true,
      communityChannelLink: true,
      professionalId: true,
      status: true,
    },
  });

  if (!suggestion) throw new Error("Mosque recommendation not found.");
  if (suggestion.status === "APPROVED") return;

  const mosque = await prisma.mosque.create({
    data: {
      name: suggestion.name,
      slug: await buildUniqueMosqueSlug(suggestion.name),
      city: suggestion.city,
      address: suggestion.address,
      website: suggestion.website,
      communityChannelType: suggestion.communityChannelType || "WhatsApp",
      communityChannelName: suggestion.communityChannelName,
      communityChannelLink: suggestion.communityChannelLink,
      isActive: true,
    },
  });

  if (suggestion.professionalId) {
    await prisma.professional.updateMany({
      where: { id: suggestion.professionalId },
      data: { mosqueId: mosque.id },
    });
  }

  await prisma.mosqueSuggestion.update({
    where: { id },
    data: {
      status: "APPROVED",
      referenceMosqueId: mosque.id,
      reviewedAt: new Date(),
    },
  });

  revalidatePath("/admin/mosques");
  revalidatePath("/professionals");
  revalidatePath("/professionals/register");
}

export async function updateMosque(
  id: string,
  data: {
    name?: string;
    city?: string;
    address?: string;
    website?: string;
    communityChannelType?: string;
    communityChannelName?: string;
    communityChannelLink?: string;
    isActive?: boolean;
  }
) {
  await prisma.mosque.update({ where: { id }, data });
  revalidatePath("/admin/mosques");
  revalidatePath("/professionals/register");
}

export async function toggleMosqueActive(id: string, isActive: boolean) {
  await prisma.mosque.update({ where: { id }, data: { isActive } });
  revalidatePath("/admin/mosques");
}
