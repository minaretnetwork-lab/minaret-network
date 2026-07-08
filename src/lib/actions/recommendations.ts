"use server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function submitRecommendation(professionalId: string, content: string, highlyRecommended = false) {
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
    data: { professionalId, userId: dbUser.id, content, highlyRecommended, status: "PENDING" },
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
