"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { getProfessionalDisplayPhotoUrl } from "@/lib/public-asset-url";
import { isPhotoFraming, type PhotoFraming } from "@/lib/profile-photo-framing";

export async function saveProfilePhotoFraming(professionalId: string, sourceUrl: string, framing: PhotoFraming) {
  if (!isPhotoFraming(framing)) return { ok: false, error: "Choose a valid photo position and zoom." };
  const supabase = await createClient();
  const { data: { user: sessionUser } } = await supabase.auth.getUser();
  if (!sessionUser) return { ok: false, error: "Please sign in to edit your photo." };
  const user = await prisma.user.findUnique({ where: { supabaseId: sessionUser.id }, select: { id: true, isActive: true } });
  if (!user?.isActive) return { ok: false, error: "Your account cannot edit this profile." };
  const ownerWhere = {
    id: professionalId,
    AND: [
      { OR: [{ userId: user.id }, { claimedByUserId: user.id }] },
      { OR: [{ isAdminCreated: false }, { claimedByUserId: { not: null } }] },
    ],
  };
  const professional = await prisma.professional.findFirst({
    where: ownerWhere,
    select: { photoUrl: true, profileSlug: true, user: { select: { avatarUrl: true } } },
  });
  if (!professional) return { ok: false, error: "You can only edit a profile you own." };
  const currentPhoto = getProfessionalDisplayPhotoUrl({ photoUrl: professional.photoUrl, avatarUrl: professional.user?.avatarUrl });
  if (!currentPhoto || currentPhoto !== sourceUrl) return { ok: false, error: "The photo has changed. Reload the profile and try again." };
  const result = await prisma.professional.updateMany({
    where: { ...ownerWhere, photoUrl: professional.photoUrl,
      ...(professional.photoUrl === null && { user: { is: { avatarUrl: professional.user?.avatarUrl } } }),
    },
    data: { photoFraming: { sourceUrl, x: framing.x, y: framing.y, zoom: framing.zoom } },
  });
  if (!result.count) return { ok: false, error: "The profile changed. Reload it and try again." };
  revalidatePath(`/professionals/${professionalId}`);
  if (professional.profileSlug) revalidatePath(`/professional/${professional.profileSlug}`);
  return { ok: true };
}
