"use server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function submitServiceRequest(data: {
  categoryId: string;
  serviceAreaId?: string;
  description: string;
  preferredContact: "EMAIL" | "PHONE" | "WHATSAPP";
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  preferredDate?: string;
}) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } });
    if (!dbUser) throw new Error("User not found");

    const mosqueSlug = process.env.NEXT_PUBLIC_DEFAULT_MOSQUE_SLUG ?? "al-falah";
    const mosque = await prisma.mosque.findUnique({ where: { slug: mosqueSlug } });
    if (!mosque) throw new Error("Mosque not found");

    const [request] = await Promise.all([
      prisma.serviceRequest.create({
        data: {
          mosqueId: mosque.id,
          userId: dbUser.id,
          categoryId: data.categoryId,
          serviceAreaId: data.serviceAreaId || null,
          description: data.description,
          preferredContact: data.preferredContact,
          contactName: data.contactName,
          contactEmail: data.contactEmail,
          contactPhone: data.contactPhone || null,
          preferredDate: data.preferredDate ? new Date(data.preferredDate) : null,
        },
      }),
      // Backfill profile with contact details entered in the form
      prisma.user.update({
        where: { id: dbUser.id },
        data: {
          // Only update displayName if profile has none
          ...(!dbUser.displayName && data.contactName ? { displayName: data.contactName } : {}),
          // Always update phone if the form has one (user may have added it just now)
          ...(data.contactPhone ? { phone: data.contactPhone } : {}),
        },
      }),
    ]);

    revalidatePath("/dashboard/requests");
    revalidatePath("/dashboard/leads");
    revalidatePath("/dashboard/profile");
    return request;
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to submit request";
    throw new Error(message);
  }
}

export async function getMyServiceRequests() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } });
  if (!dbUser) return [];

  return prisma.serviceRequest.findMany({
    where: { userId: dbUser.id },
    include: {
      category: { select: { name: true, slug: true, icon: true } },
      serviceArea: { select: { name: true } },
      assignedTo: {
        include: {
          user: { select: { firstName: true, lastName: true, displayName: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

async function getCurrentDbUserWithListings() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  return prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: {
      professionals: {
        where: { status: "APPROVED" },
        select: {
          id: true,
          businessName: true,
          title: true,
          categoryId: true,
          category: { select: { name: true, slug: true, icon: true } },
          user: { select: { firstName: true, lastName: true, displayName: true } },
          serviceAreas: { select: { id: true, name: true } },
        },
      },
    },
  });
}

function buildProfessionalRequestFilters(
  professionals: NonNullable<Awaited<ReturnType<typeof getCurrentDbUserWithListings>>>["professionals"]
) {
  return professionals.flatMap((professional) => {
    const serviceAreaIds = professional.serviceAreas.map((area) => area.id);
    if (serviceAreaIds.length === 0) return [];

    return {
      categoryId: professional.categoryId,
      serviceAreaId: { in: serviceAreaIds },
    };
  });
}

export async function getMatchingServiceRequests(limit?: number) {
  const dbUser = await getCurrentDbUserWithListings();
  if (!dbUser || dbUser.professionals.length === 0) return [];

  const filters = buildProfessionalRequestFilters(dbUser.professionals);
  if (filters.length === 0) return [];

  const requests = await prisma.serviceRequest.findMany({
    where: {
      userId: { not: dbUser.id },
      status: "OPEN",
      OR: filters,
    },
    include: {
      category: { select: { name: true, slug: true, icon: true } },
      serviceArea: { select: { id: true, name: true } },
      conversations: {
        where: { professional: { userId: dbUser.id } },
        select: {
          id: true,
          professionalId: true,
          professional: {
            select: {
              id: true,
              businessName: true,
              title: true,
              user: { select: { firstName: true, lastName: true, displayName: true } },
            },
          },
        },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
    ...(limit ? { take: limit } : {}),
  });

  return requests.map((request) => {
    const conversation = request.conversations[0] ?? null;
    const matchedProfessional =
      conversation?.professional ??
      dbUser.professionals.find((professional) => {
        const matchesCategory = professional.categoryId === request.categoryId;
        const matchesArea = request.serviceAreaId
          ? professional.serviceAreas.some((area) => area.id === request.serviceAreaId)
          : false;
        return matchesCategory && matchesArea;
      }) ??
      null;

    return {
      ...request,
      matchedProfessional,
      conversationId: conversation?.id ?? null,
    };
  });
}

export async function getMatchingServiceRequestById(id: string) {
  const dbUser = await getCurrentDbUserWithListings();
  if (!dbUser || dbUser.professionals.length === 0) return null;

  const filters = buildProfessionalRequestFilters(dbUser.professionals);
  if (filters.length === 0) return null;

  const request = await prisma.serviceRequest.findFirst({
    where: {
      id,
      userId: { not: dbUser.id },
      status: "OPEN",
      OR: filters,
    },
    include: {
      category: { select: { id: true, name: true, slug: true, icon: true } },
      serviceArea: { select: { id: true, name: true } },
      user: { select: { displayName: true, firstName: true, lastName: true } },
      conversations: {
        where: { professional: { userId: dbUser.id } },
        select: {
          id: true,
          professionalId: true,
          professional: {
            select: {
              id: true,
              businessName: true,
              title: true,
              user: { select: { firstName: true, lastName: true, displayName: true } },
            },
          },
        },
        take: 1,
      },
    },
  });

  if (!request) return null;

  const conversation = request.conversations[0] ?? null;
  const matchedProfessional =
    conversation?.professional ??
    dbUser.professionals.find((professional) => {
      const matchesCategory = professional.categoryId === request.categoryId;
      const matchesArea = request.serviceAreaId
        ? professional.serviceAreas.some((area) => area.id === request.serviceAreaId)
        : false;
      return matchesCategory && matchesArea;
    }) ??
    null;

  return {
    ...request,
    matchedProfessional,
    conversationId: conversation?.id ?? null,
  };
}

export async function getServiceRequestById(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } });
  if (!dbUser) return null;

  return prisma.serviceRequest.findFirst({
    where: { id, userId: dbUser.id },
    include: {
      category: { select: { name: true, slug: true, icon: true } },
      serviceArea: { select: { name: true } },
      assignedTo: {
        include: {
          user: { select: { firstName: true, lastName: true, displayName: true, avatarUrl: true } },
        },
      },
    },
  });
}

export async function getAllServiceRequests(mosqueSlug: string) {
  const mosque = await prisma.mosque.findUnique({ where: { slug: mosqueSlug } });
  if (!mosque) return [];

  return prisma.serviceRequest.findMany({
    where: { mosqueId: mosque.id },
    include: {
      user: { select: { firstName: true, lastName: true, displayName: true, email: true } },
      category: { select: { name: true, slug: true, icon: true } },
      serviceArea: { select: { name: true } },
      assignedTo: {
        include: {
          user: { select: { firstName: true, lastName: true, displayName: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateRequestStatus(id: string, status: string) {
  await prisma.serviceRequest.update({
    where: { id },
    data: { status: status as never },
  });
  revalidatePath("/admin/requests");
  revalidatePath("/dashboard/leads");
}
