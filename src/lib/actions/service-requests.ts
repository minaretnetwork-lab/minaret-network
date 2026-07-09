"use server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function submitServiceRequest(data: {
  categoryId: string;
  serviceAreaId?: string;
  description: string;
  preferredContact: "EMAIL" | "PHONE" | "WHATSAPP";
  contactValue: string;
  preferredDate?: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } });
  if (!dbUser) throw new Error("User not found");

  const mosqueSlug = process.env.NEXT_PUBLIC_DEFAULT_MOSQUE_SLUG ?? "al-falah";
  const mosque = await prisma.mosque.findUnique({ where: { slug: mosqueSlug } });
  if (!mosque) throw new Error("Mosque not found");

  const request = await prisma.serviceRequest.create({
    data: {
      mosqueId: mosque.id,
      userId: dbUser.id,
      categoryId: data.categoryId,
      serviceAreaId: data.serviceAreaId || null,
      description: data.description,
      preferredContact: data.preferredContact,
      contactValue: data.contactValue,
      preferredDate: data.preferredDate ? new Date(data.preferredDate) : null,
    },
  });

  revalidatePath("/dashboard/requests");
  return request;
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
      category: { select: { name: true, icon: true } },
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

export async function getAllServiceRequests(mosqueSlug: string) {
  const mosque = await prisma.mosque.findUnique({ where: { slug: mosqueSlug } });
  if (!mosque) return [];

  return prisma.serviceRequest.findMany({
    where: { mosqueId: mosque.id },
    include: {
      user: { select: { firstName: true, lastName: true, displayName: true, email: true } },
      category: { select: { name: true, icon: true } },
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
