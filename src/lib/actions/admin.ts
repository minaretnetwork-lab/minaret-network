"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function approveProfessional(id: string) {
  await prisma.professional.update({
    where: { id },
    data: { status: "APPROVED", approvedAt: new Date(), rejectionReason: null },
  });
  revalidatePath("/admin/professionals");
}

export async function rejectProfessional(id: string, reason: string) {
  await prisma.professional.update({
    where: { id },
    data: { status: "REJECTED", rejectionReason: reason },
  });
  revalidatePath("/admin/professionals");
}

export async function suspendProfessional(id: string) {
  await prisma.professional.update({
    where: { id },
    data: { status: "SUSPENDED" },
  });
  revalidatePath("/admin/professionals");
}

export async function awardBadge(professionalId: string, type: string) {
  await prisma.verificationBadge.upsert({
    where: { professionalId_type: { professionalId, type: type as never } },
    update: { issuedAt: new Date() },
    create: { professionalId, type: type as never },
  });
  revalidatePath("/admin/professionals");
}

export async function revokeBadge(professionalId: string, type: string) {
  await prisma.verificationBadge.deleteMany({
    where: { professionalId, type: type as never },
  });
  revalidatePath("/admin/professionals");
}

export async function getAdminStats(mosqueSlug: string) {
  const mosque = await prisma.mosque.findUnique({ where: { slug: mosqueSlug } });
  if (!mosque) return null;

  const [
    totalProfessionals,
    pendingProfessionals,
    approvedProfessionals,
    totalMembers,
    openRequests,
    pendingRecommendations,
  ] = await Promise.all([
    prisma.professional.count({ where: { mosqueId: mosque.id } }),
    prisma.professional.count({ where: { mosqueId: mosque.id, status: "PENDING" } }),
    prisma.professional.count({ where: { mosqueId: mosque.id, status: "APPROVED" } }),
    prisma.user.count({ where: { mosqueId: mosque.id, role: "MEMBER" } }),
    prisma.serviceRequest.count({ where: { mosqueId: mosque.id, status: "OPEN" } }),
    prisma.recommendation.count({ where: { status: "PENDING" } }),
  ]);

  return {
    totalProfessionals,
    pendingProfessionals,
    approvedProfessionals,
    totalMembers,
    openRequests,
    pendingRecommendations,
  };
}

export async function getProfessionalsForAdmin(_mosqueSlug: string, status?: string) {
  return prisma.professional.findMany({
    where: {
      ...(status && { status: status as never }),
    },
    include: {
      user: { select: { firstName: true, lastName: true, displayName: true, email: true, phone: true } },
      mosque: { select: { name: true, communityChannelType: true, communityChannelName: true, communityChannelLink: true } },
      category: { select: { name: true, slug: true } },
      badges: true,
      recommendations: { where: { status: "APPROVED" }, select: { id: true } },
      credentials: { select: { id: true, name: true, isVerified: true } },
    },
    orderBy: { submittedAt: "desc" },
  });
}
