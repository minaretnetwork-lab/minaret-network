"use server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { CURRENT_BROADCAST_CONSENT_VERSION } from "@/lib/constants";

export async function submitServiceRequest(data: {
  categoryId: string;
  serviceAreaId?: string;
  description: string;
  preferredContact: "EMAIL" | "PHONE" | "WHATSAPP";
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  preferredDate?: string;
  broadcastConsentAt?: string;
}) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } });
    if (!dbUser) throw new Error("User not found");

    // Reject regulated professions before doing anything else
    const category = await prisma.category.findUnique({
      where: { id: data.categoryId },
      select: { id: true, isRegulatedProfession: true },
    });
    if (!category) throw new Error("Category not found");
    if (category.isRegulatedProfession) {
      throw new Error(
        "Service requests cannot be submitted for regulated professions. " +
        "Please search for a professional directly and message them one-to-one."
      );
    }

    // Require broadcast consent
    if (!data.broadcastConsentAt) {
      throw new Error(
        "You must acknowledge that your request will be shared with multiple professionals before submitting."
      );
    }

    const mosqueSlug = process.env.NEXT_PUBLIC_DEFAULT_MOSQUE_SLUG ?? "al-falah";
    const mosque = await prisma.mosque.findUnique({ where: { slug: mosqueSlug } });
    if (!mosque) throw new Error("Mosque not found");

    const now = new Date(data.broadcastConsentAt);

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
          broadcastConsentAt: now,
          broadcastConsentVersion: CURRENT_BROADCAST_CONSENT_VERSION,
        },
      }),
      // Backfill profile with contact details entered in the form
      prisma.user.update({
        where: { id: dbUser.id },
        data: {
          ...(!dbUser.displayName && data.contactName ? { displayName: data.contactName } : {}),
          ...(data.contactPhone ? { phone: data.contactPhone } : {}),
          preferredContact: data.preferredContact,
        },
      }),
    ]);

    // Log the broadcast to all BROADCAST_ELIGIBLE professionals in the matching category+area
    const [broadcastEligibleProfessionals, categoryRecord, serviceAreaRecord] = await Promise.all([
      prisma.professional.findMany({
        where: {
          categoryId: data.categoryId,
          tier: "BROADCAST_ELIGIBLE",
          status: "APPROVED",
          ...(data.serviceAreaId
            ? { serviceAreas: { some: { id: data.serviceAreaId } } }
            : {}),
        },
        select: {
          id: true,
          businessName: true,
          user: { select: { email: true, firstName: true, displayName: true } },
        },
      }),
      prisma.category.findUnique({ where: { id: data.categoryId }, select: { name: true } }),
      data.serviceAreaId
        ? prisma.serviceArea.findUnique({ where: { id: data.serviceAreaId }, select: { name: true } })
        : Promise.resolve(null),
    ]);

    if (broadcastEligibleProfessionals.length > 0) {
      await prisma.broadcastLog.createMany({
        data: broadcastEligibleProfessionals.map((p) => ({
          serviceRequestId: request.id,
          professionalId: p.id,
          channel: "platform",
        })),
      });

      // Notify each matched professional by email
      const { sendNewLeadEmail } = await import("@/lib/email");
      const categoryName = categoryRecord?.name ?? "Professional";
      const areaName = serviceAreaRecord?.name ?? "your area";
      for (const professional of broadcastEligibleProfessionals) {
        if (!professional.user?.email) continue;
        const firstName = professional.user?.firstName ?? professional.user?.displayName ?? "there";
        sendNewLeadEmail(professional.user.email, firstName, {
          category: categoryName,
          area: areaName,
          description: data.description,
        }).catch(console.error);
      }
    }

    revalidatePath("/dashboard/requests");
    revalidatePath("/dashboard/leads");
    revalidatePath("/dashboard/profile");
    return request;
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to submit request";
    throw new Error(message);
  }
}

export async function getMyServiceRequests(options?: { includeArchived?: boolean }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } });
  if (!dbUser) return [];

  return prisma.serviceRequest.findMany({
    where: {
      userId: dbUser.id,
      ...(options?.includeArchived ? {} : { requesterArchivedAt: null }),
    },
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
  const professionalIds = dbUser.professionals.map((professional) => professional.id);

  const requests = await prisma.serviceRequest.findMany({
    where: {
      userId: { not: dbUser.id },
      status: { in: ["OPEN", "IN_PROGRESS"] },
      AND: [
        { OR: filters },
        {
          OR: [
            { assignedToId: null },
            { assignedToId: { in: professionalIds } },
          ],
        },
      ],
    },
    omit: { contactPhone: true, contactEmail: true },
    include: {
      category: { select: { name: true, slug: true, icon: true } },
      serviceArea: { select: { id: true, name: true, slug: true } },
      user: { select: { displayName: true, firstName: true, lastName: true, email: true } },
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
  const professionalIds = dbUser.professionals.map((professional) => professional.id);

  const request = await prisma.serviceRequest.findFirst({
    where: {
      id,
      userId: { not: dbUser.id },
      AND: [
        { OR: filters },
        {
          OR: [
            { assignedToId: null },
            { assignedToId: { in: professionalIds } },
          ],
        },
      ],
    },
    omit: { contactPhone: true, contactEmail: true },
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

export async function closeMyServiceRequest(id: string, data: { reason: string; note?: string }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } });
  if (!dbUser) throw new Error("User not found");

  const reason = data.reason.trim();
  const note = data.note?.trim() ?? "";
  if (!reason) throw new Error("Please choose a reason for closing this request.");

  const request = await prisma.serviceRequest.findFirst({
    where: { id, userId: dbUser.id },
    select: { id: true, status: true },
  });

  if (!request) throw new Error("Request not found.");
  if (request.status === "CLOSED" || request.status === "CANCELLED") return;

  await prisma.serviceRequest.update({
    where: { id },
    data: {
      status: "CLOSED",
      closeReason: reason,
      closeNote: note || null,
      closedAt: new Date(),
      requesterArchivedAt: null,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/requests");
  revalidatePath(`/dashboard/requests/${id}`);
  revalidatePath("/dashboard/leads");
}

export async function reopenMyServiceRequest(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } });
  if (!dbUser) throw new Error("User not found");

  const request = await prisma.serviceRequest.findFirst({
    where: { id, userId: dbUser.id },
    select: { id: true, status: true },
  });

  if (!request) throw new Error("Request not found.");
  if (request.status === "OPEN") return;

  await prisma.serviceRequest.update({
    where: { id },
    data: {
      status: "OPEN",
      closeReason: null,
      closeNote: null,
      closedAt: null,
      requesterArchivedAt: null,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/requests");
  revalidatePath(`/dashboard/requests/${id}`);
  revalidatePath("/dashboard/messages");
  revalidatePath("/dashboard/leads");
}

export async function setMyServiceRequestArchivedState(id: string, archived: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } });
  if (!dbUser) throw new Error("User not found");

  const request = await prisma.serviceRequest.findFirst({
    where: { id, userId: dbUser.id },
    select: { id: true, status: true },
  });

  if (!request) throw new Error("Request not found.");
  if (!["CLOSED", "CANCELLED"].includes(request.status)) {
    throw new Error("Only closed or cancelled requests can be archived.");
  }

  await prisma.serviceRequest.update({
    where: { id },
    data: {
      requesterArchivedAt: archived ? new Date() : null,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/requests");
  revalidatePath(`/dashboard/requests/${id}`);
}

export async function broadcastMyServiceRequest(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } });
  if (!dbUser) throw new Error("User not found");

  const request = await prisma.serviceRequest.findFirst({
    where: { id, userId: dbUser.id },
    select: { id: true, assignedToId: true, status: true },
  });

  if (!request) throw new Error("Request not found.");
  if (!request.assignedToId) return;
  if (request.status === "CLOSED" || request.status === "CANCELLED") {
    throw new Error("Reopen this request before broadcasting it.");
  }

  await prisma.serviceRequest.update({
    where: { id },
    data: { assignedToId: null },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/requests");
  revalidatePath(`/dashboard/requests/${id}`);
  revalidatePath("/dashboard/leads");
}
