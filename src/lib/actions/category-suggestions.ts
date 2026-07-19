"use server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { DEFAULT_MOSQUE_SLUG } from "@/lib/constants";

export async function submitCategorySuggestion(name: string, icon?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } });
  if (!dbUser) throw new Error("User not found");

  const mosque = await prisma.mosque.findUnique({ where: { slug: DEFAULT_MOSQUE_SLUG } });
  if (!mosque) throw new Error("Mosque not found");

  await prisma.categorySuggestion.create({
    data: {
      name: name.trim(),
      icon: icon?.trim() || null,
      mosqueId: mosque.id,
      requestedById: dbUser.id,
    },
  });

  revalidatePath("/admin/category-suggestions");
}

export async function getCategorySuggestions() {
  return prisma.categorySuggestion.findMany({
    include: {
      requestedBy: { select: { firstName: true, lastName: true, displayName: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function approveCategorySuggestion(id: string) {
  const suggestion = await prisma.categorySuggestion.findUnique({ where: { id }, include: { mosque: true } });
  if (!suggestion) throw new Error("Suggestion not found");

  const slug = suggestion.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  await prisma.category.upsert({
    where: { slug_mosqueId: { slug, mosqueId: suggestion.mosqueId } },
    update: { name: suggestion.name, icon: suggestion.icon ?? "⭐", isActive: true },
    create: {
      name: suggestion.name,
      slug,
      icon: suggestion.icon ?? "⭐",
      mosqueId: suggestion.mosqueId,
      isActive: true,
    },
  });

  await prisma.categorySuggestion.update({
    where: { id },
    data: { status: "APPROVED", reviewedAt: new Date() },
  });

  revalidatePath("/admin/category-suggestions");
  revalidatePath("/professionals");
  revalidatePath("/professionals/register");
  revalidatePath("/request");
  revalidatePath("/categories");
}

export async function rejectCategorySuggestion(id: string, adminNote?: string) {
  await prisma.categorySuggestion.update({
    where: { id },
    data: { status: "REJECTED", adminNote: adminNote ?? null, reviewedAt: new Date() },
  });
  revalidatePath("/admin/category-suggestions");
}
