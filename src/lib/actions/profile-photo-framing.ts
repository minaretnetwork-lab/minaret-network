"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { getProfessionalDisplayPhotoUrl } from "@/lib/public-asset-url";
import { isPhotoFraming, type PhotoFraming } from "@/lib/profile-photo-framing";
import { profilePhotoEditWhere } from "@/lib/profile-permissions";

export async function saveProfilePhotoFraming(professionalId: string, sourceUrl: string, framing: PhotoFraming) {
  if (!isPhotoFraming(framing)) return { ok: false, error: "Choose a valid photo position and zoom." };
  const supabase = await createClient();
  const { data: { user: sessionUser } } = await supabase.auth.getUser();
  if (!sessionUser) return { ok: false, error: "Please sign in to edit your photo." };
  const user = await prisma.user.findUnique({ where: { supabaseId: sessionUser.id }, select: { id: true, isActive: true, role: true } });
  if (!user?.isActive) return { ok: false, error: "Your account cannot edit this profile." };
  const editWhere = profilePhotoEditWhere(professionalId, user);
  const professional = await prisma.professional.findFirst({
    where: editWhere,
    select: { photoUrl: true, profileSlug: true, user: { select: { avatarUrl: true } } },
  });
  if (!professional) return { ok: false, error: "You do not have permission to edit this profile." };
  const currentPhoto = getProfessionalDisplayPhotoUrl({ photoUrl: professional.photoUrl, avatarUrl: professional.user?.avatarUrl });
  if (!currentPhoto || currentPhoto !== sourceUrl) return { ok: false, error: "The photo has changed. Reload the profile and try again." };
  const result = await prisma.professional.updateMany({
    where: { ...editWhere, photoUrl: professional.photoUrl,
      ...(professional.photoUrl === null && { user: { is: professional.user ? { avatarUrl: professional.user.avatarUrl } : null } }),
    },
    data: { photoFraming: { sourceUrl, x: framing.x, y: framing.y, zoom: framing.zoom } },
  });
  if (!result.count) return { ok: false, error: "The profile changed. Reload it and try again." };
  revalidatePath(`/professionals/${professionalId}`);
  if (professional.profileSlug) revalidatePath(`/professional/${professional.profileSlug}`);
  revalidatePath(`/admin/professionals/${professionalId}/edit`);
  return { ok: true };
}
