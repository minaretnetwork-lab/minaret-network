import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isProfileAdmin, profilePhotoEditWhere } from "@/lib/profile-permissions";
import { getProfessionalDisplayPhotoUrl } from "@/lib/public-asset-url";
import { isPhotoFraming } from "@/lib/profile-photo-framing";
import { optimizeUploadedImage } from "@/lib/upload-images";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const fail = (error: string, status: number) => Response.json({ ok: false, error }, { status });
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return fail("Invalid request origin.", 403);
  const supabase = await createClient();
  const { data: { user: sessionUser } } = await supabase.auth.getUser();
  if (!sessionUser) return fail("Please sign in to edit your photo.", 401);
  const user = await prisma.user.findUnique({ where: { supabaseId: sessionUser.id }, select: { id: true, role: true, isActive: true } });
  if (!user?.isActive) return fail("Your account cannot edit this profile.", 403);
  const { id } = await params;
  const editWhere = profilePhotoEditWhere(id, user);
  const professional = await prisma.professional.findFirst({
    where: editWhere,
    select: { photoUrl: true, profileSlug: true, user: { select: { avatarUrl: true } },
      isFeatured: true, featuredListings: { where: { status: "ACTIVE" }, select: { id: true }, take: 1 },
    },
  });
  if (!professional) return fail("You do not have permission to edit this profile.", 403);
  if (!isProfileAdmin(user) && (professional.isFeatured || professional.featuredListings.length)) {
    return fail("Use Edit profile to submit a new picture for review on a featured listing.", 403);
  }

  let form: FormData;
  let framing: unknown;
  try {
    form = await request.formData();
    framing = JSON.parse(String(form.get("framing")));
  } catch { return fail("Choose a photo and valid framing.", 400); }
  if (!isPhotoFraming(framing)) return fail("Choose a valid photo position and zoom.", 400);
  const currentPhoto = getProfessionalDisplayPhotoUrl({ photoUrl: professional.photoUrl, avatarUrl: professional.user?.avatarUrl });
  if (form.get("sourceUrl") !== (currentPhoto ?? "")) return fail("The photo has changed. Reload the profile and try again.", 409);
  const file = form.get("photo");
  if (!(file instanceof File)) return fail("Choose a profile photo.", 400);
  let optimized: Awaited<ReturnType<typeof optimizeUploadedImage>>;
  try { optimized = await optimizeUploadedImage(file, "photo"); }
  catch (error) { return fail(error instanceof Error ? error.message : "Could not process this photo.", 400); }

  const storage = createAdminClient().storage.from("professional-photos");
  // A unique object keeps the current picture intact until the replacement is saved.
  const path = `${user.id}/${id}/${crypto.randomUUID()}.${optimized.extension}`;
  let uploaded = false;
  let saved = false;
  try {
    const { error } = await storage.upload(path, optimized.output, { contentType: optimized.contentType });
    if (error) throw error;
    uploaded = true;
    const { data } = storage.getPublicUrl(path);
    const photoUrl = data.publicUrl;
    const result = await prisma.professional.updateMany({
      where: { ...editWhere, photoUrl: professional.photoUrl,
        ...(professional.photoUrl === null && { user: { is: professional.user ? { avatarUrl: professional.user.avatarUrl } : null } }),
      },
      data: { photoUrl, photoFraming: { sourceUrl: photoUrl, x: framing.x, y: framing.y, zoom: framing.zoom } },
    });
    if (!result.count) return fail("The profile changed. Reload it and try again.", 409);
    saved = true;
    revalidatePath(`/professionals/${id}`);
    if (professional.profileSlug) revalidatePath(`/professional/${professional.profileSlug}`);
    revalidatePath("/professionals");
    revalidatePath("/dashboard/professional");
    revalidatePath(`/admin/professionals/${id}`);
    revalidatePath(`/admin/professionals/${id}/edit`);
    return Response.json({ ok: true });
  } catch { return fail("Could not save the profile photo. Please try again.", 500); }
  finally {
    if (uploaded && !saved) await storage.remove([path]).catch(() => {});
  }
}
