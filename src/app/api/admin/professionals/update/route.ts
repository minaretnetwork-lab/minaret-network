import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { normalizePublicAssetUrl } from "@/lib/public-asset-url";
import { IMAGE_UPLOAD_LIMIT_BYTES } from "@/lib/upload-image-config";
import { optimizeUploadedImage } from "@/lib/upload-images";

async function ensureStorageBucket(bucket: string) {
  const admin = createAdminClient();
  const { error: bucketErr } = await admin.storage.createBucket(bucket, {
    public: true,
    fileSizeLimit: IMAGE_UPLOAD_LIMIT_BYTES,
    allowedMimeTypes: ["image/webp"],
  });
  if (bucketErr && !bucketErr.message.includes("already exists")) throw bucketErr;
  const { error: updateErr } = await admin.storage.updateBucket(bucket, {
    public: true,
    fileSizeLimit: IMAGE_UPLOAD_LIMIT_BYTES,
    allowedMimeTypes: ["image/webp"],
  });
  if (updateErr) throw updateErr;
}

async function uploadToStorage(
  bucket: string,
  path: string,
  optimized: Awaited<ReturnType<typeof optimizeUploadedImage>>,
): Promise<string> {
  const admin = createAdminClient();
  await ensureStorageBucket(bucket);
  const { error: uploadErr } = await admin.storage
    .from(bucket)
    .upload(path, optimized.output, { upsert: true, contentType: optimized.contentType });
  if (uploadErr) throw uploadErr;
  const { data } = admin.storage.from(bucket).getPublicUrl(path);
  return `${normalizePublicAssetUrl(data.publicUrl)}?t=${Date.now()}`;
}

export async function POST(request: Request) {
  const startedAt = Date.now();
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } });
    if (!dbUser || !["ADMIN", "SUPER_ADMIN", "LISTING_MANAGER"].includes(dbUser.role)) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 403 });
    }

    const formData = await request.formData();
    const professionalId = formData.get("professionalId") as string | null;
    if (!professionalId) return NextResponse.json({ ok: false, error: "professionalId is required." }, { status: 400 });

    const existing = await prisma.professional.findUnique({
      where: { id: professionalId },
      select: { id: true, userId: true, status: true },
    });
    if (!existing) return NextResponse.json({ ok: false, error: "Listing not found." }, { status: 404 });

    const rawMosqueId = formData.get("mosqueId") as string | null;
    const mosqueIsUnlisted = rawMosqueId === "unlisted";
    const mosqueId = (!rawMosqueId || mosqueIsUnlisted) ? null : rawMosqueId;
    const mosque = mosqueId ? await prisma.mosque.findUnique({ where: { id: mosqueId } }) : null;
    if (mosqueId && !mosque) return NextResponse.json({ ok: false, error: "Selected mosque not found." }, { status: 400 });

    const categoryIds = Array.from(new Set(
      formData.getAll("categoryIds").filter((v): v is string => typeof v === "string" && Boolean(v))
    ));
    const legacyCategoryId = formData.get("categoryId") as string | null;
    const categoryId = categoryIds[0] ?? legacyCategoryId;
    if (!categoryId) return NextResponse.json({ ok: false, error: "Please select at least one category." }, { status: 400 });
    const selectedCategoryIds = categoryIds.length > 0 ? categoryIds : [categoryId];

    const languages = formData.getAll("languages") as string[];
    const serviceAreaIds = formData.getAll("serviceAreaIds") as string[];
    const galleryRemoveIds = formData.getAll("galleryRemove") as string[];
    const GALLERY_MAX = 3;
    const galleryFiles = [0, 1, 2]
      .map((i) => formData.get(`gallery_${i}`) as File | null)
      .filter((f): f is File => Boolean(f && f.size > 0));

    const photoFile = formData.get("photo") as File | null;
    const logoFile = formData.get("logo") as File | null;
    let photoUrl: string | null = null;
    let logoUrl: string | null = null;

    if (photoFile && photoFile.size > 0) {
      const optimized = await optimizeUploadedImage(photoFile, "photo");
      photoUrl = await uploadToStorage(
        "professional-photos",
        `${existing.userId}/${professionalId}/photo.${optimized.extension}`,
        optimized,
      );
    }
    if (logoFile && logoFile.size > 0) {
      const optimized = await optimizeUploadedImage(logoFile, "logo");
      logoUrl = await uploadToStorage(
        "professional-logos",
        `${existing.userId}/${professionalId}/logo.${optimized.extension}`,
        optimized,
      );
    }

    const availability = formData.get("availability") as string | null;

    await prisma.professional.update({
      where: { id: professionalId },
      data: {
        mosqueId: mosque?.id ?? null,
        categoryId,
        categories: { set: selectedCategoryIds.map((id) => ({ id })) },
        serviceAreas: { set: serviceAreaIds.map((id) => ({ id })) },
        ...(photoUrl && { photoUrl }),
        ...(logoUrl && { logoUrl }),
        businessName: (formData.get("businessName") as string | null)?.trim() || null,
        title: (formData.get("title") as string | null)?.trim() || null,
        bio: (formData.get("bio") as string | null)?.trim() || null,
        yearsOfExperience: formData.get("yearsOfExperience") ? Number(formData.get("yearsOfExperience")) : null,
        qualifications: (formData.get("qualifications") as string | null)?.trim() || null,
        licenses: (formData.get("licenses") as string | null)?.trim() || null,
        languages,
        phone: (formData.get("phone") as string | null)?.trim() || null,
        email: (formData.get("email") as string | null)?.trim() || null,
        website: (formData.get("website") as string | null)?.trim() || null,
        whatsapp: (formData.get("whatsapp") as string | null)?.trim() || null,
        businessAddress: (formData.get("businessAddress") as string | null)?.trim() || null,
        acceptsWalkIns: formData.get("acceptsWalkIns") === "true",
        availability: availability?.trim() || null,
      },
    });

    // Gallery: remove then add
    if (galleryRemoveIds.length > 0) {
      await prisma.galleryImage.deleteMany({
        where: { id: { in: galleryRemoveIds }, professionalId },
      });
    }
    if (galleryFiles.length > 0) {
      const existingCount = await prisma.galleryImage.count({ where: { professionalId } });
      const slotsLeft = GALLERY_MAX - existingCount;
      const toUpload = galleryFiles.slice(0, slotsLeft);
      for (let i = 0; i < toUpload.length; i++) {
        const optimized = await optimizeUploadedImage(toUpload[i], "gallery");
        const url = await uploadToStorage(
          "professional-gallery",
          `${existing.userId}/${professionalId}/gallery_${Date.now()}_${i}.${optimized.extension}`,
          optimized,
        );
        await prisma.galleryImage.create({
          data: { professionalId, url, sortOrder: existingCount + i },
        });
      }
    }

    revalidatePath("/admin/professionals");
    revalidatePath(`/admin/professionals/${professionalId}`);
    revalidatePath(`/professionals/${professionalId}`);
    revalidatePath("/professionals");
    console.info("POST /api/admin/professionals/update success", {
      adminId: dbUser.id,
      professionalId,
      durationMs: Date.now() - startedAt,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST /api/admin/professionals/update:", err);
    const message = err instanceof Error ? err.message : "An unexpected error occurred.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
