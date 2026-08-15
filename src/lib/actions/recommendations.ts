"use server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function reportRecommendation(recommendationId: string, reason: string, detail?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } });
  if (!dbUser) throw new Error("User not found");

  const rec = await prisma.recommendation.findUnique({
    where: { id: recommendationId },
    select: { professionalId: true, userId: true },
  });
  if (!rec) throw new Error("Review not found");
  if (rec.userId === dbUser.id) throw new Error("You cannot report your own review");

  await prisma.recommendationReport.upsert({
    where: { recommendationId_reportedById: { recommendationId, reportedById: dbUser.id } },
    update: { reason, detail: detail ?? null, status: "OPEN", resolvedAt: null, resolutionNote: null },
    create: { recommendationId, reportedById: dbUser.id, reason, detail: detail ?? null },
  });

  revalidatePath(`/professionals/${rec.professionalId}`);
  return { success: true };
}

export async function resolveReport(reportId: string, status: "ACTIONED" | "DISMISSED", note?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } });
  if (!dbUser || (dbUser.role !== "ADMIN" && dbUser.role !== "SUPER_ADMIN")) {
    throw new Error("Not authorized");
  }

  await prisma.recommendationReport.update({
    where: { id: reportId },
    data: { status, resolutionNote: note ?? null, resolvedAt: new Date() },
  });

  revalidatePath("/admin/reports");
}

export async function submitRecommendation(professionalId: string, content: string, highlyRecommended = false, rating = 5) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } });
  if (!dbUser) throw new Error("User not found");

  const existing = await prisma.recommendation.findFirst({
    where: { professionalId, userId: dbUser.id },
  });
  if (existing) throw new Error("You have already submitted a recommendation for this professional");

  await prisma.recommendation.create({
    data: { professionalId, userId: dbUser.id, content, highlyRecommended, rating, status: "PENDING" },
  });

  revalidatePath(`/professionals/${professionalId}`);
  return { success: true };
}

export async function getPendingRecommendations() {
  return prisma.recommendation.findMany({
    where: { status: "PENDING" },
    include: {
      professional: {
        include: {
          user: { select: { firstName: true, lastName: true, displayName: true } },
          category: { select: { name: true } },
        },
      },
      user: { select: { firstName: true, lastName: true, displayName: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function approveRecommendation(id: string) {
  await prisma.recommendation.update({
    where: { id },
    data: { status: "APPROVED", approvedAt: new Date() },
  });
  revalidatePath("/admin/recommendations");
}

export async function rejectRecommendation(id: string, note?: string) {
  await prisma.recommendation.update({
    where: { id },
    data: { status: "REJECTED", moderatorNote: note },
  });
  revalidatePath("/admin/recommendations");
}

export async function deleteRecommendation(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } });
  if (!dbUser || (dbUser.role !== "ADMIN" && dbUser.role !== "SUPER_ADMIN")) {
    throw new Error("Not authorized");
  }

  const rec = await prisma.recommendation.findUnique({ where: { id } });
  if (!rec) throw new Error("Review not found");

  await prisma.recommendation.delete({ where: { id } });
  revalidatePath("/admin/recommendations");
  revalidatePath(`/professionals/${rec.professionalId}`);
}
