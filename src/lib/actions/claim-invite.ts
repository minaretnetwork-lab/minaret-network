"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/actions/auth";
import { createClient } from "@/lib/supabase/server";
import { randomBytes } from "crypto";

function isAdmin(role: string) {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

/** Admin: generate (or regenerate) a claim invite link for an unclaimed professional listing. */
export async function generateClaimInvite(professionalId: string): Promise<string> {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user.role)) throw new Error("Unauthorized");

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  await prisma.professional.update({
    where: { id: professionalId },
    data: { claimInviteToken: token, claimInviteExpiresAt: expiresAt },
  });

  revalidatePath(`/admin/professionals/${professionalId}`);
  return token;
}

/** Admin: revoke a previously generated claim invite link. */
export async function revokeClaimInvite(professionalId: string) {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user.role)) throw new Error("Unauthorized");

  await prisma.professional.update({
    where: { id: professionalId },
    data: { claimInviteToken: null, claimInviteExpiresAt: null },
  });

  revalidatePath(`/admin/professionals/${professionalId}`);
}

/** Public: look up an invite token — returns safe public fields only. */
export async function getClaimInviteByToken(token: string) {
  return prisma.professional.findFirst({
    where: {
      claimInviteToken: token,
      claimInviteExpiresAt: { gt: new Date() },
      claimedByUserId: null,
    },
    select: {
      id: true,
      businessName: true,
      title: true,
      city: true,
      province: true,
      status: true,
    },
  });
}

/** Public: accept a claim invite (must be logged in). */
export async function acceptClaimInvite(token: string) {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) throw new Error("You must be signed in to claim a listing.");

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: authUser.id },
    select: { id: true },
  });
  if (!dbUser) throw new Error("User account not found.");

  const professional = await prisma.professional.findFirst({
    where: {
      claimInviteToken: token,
      claimInviteExpiresAt: { gt: new Date() },
      claimedByUserId: null,
    },
    select: { id: true },
  });
  if (!professional) throw new Error("This invite link is invalid or has already been used.");

  await prisma.professional.update({
    where: { id: professional.id },
    data: {
      claimedByUserId: dbUser.id,
      claimedAt: new Date(),
      claimInviteToken: null,
      claimInviteExpiresAt: null,
    },
  });

  revalidatePath(`/professionals/${professional.id}`);
  revalidatePath(`/admin/professionals/${professional.id}`);
  return professional.id;
}
