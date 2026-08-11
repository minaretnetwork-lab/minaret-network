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

export async function createMosque(data: {
  name: string;
  city?: string;
  address?: string;
  website?: string;
  communityChannelType?: string;
  communityChannelName?: string;
  communityChannelLink?: string;
}) {
  const slug = data.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

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
