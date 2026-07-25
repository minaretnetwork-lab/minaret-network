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
}
