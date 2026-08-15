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
    if (!user) return NextResponse.json({ ok: false, error: "You must be signed in to apply." }, { status: 401 });

    const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } });
    if (!dbUser) return NextResponse.json({ ok: false, error: "Your account was not found. Please sign out and back in." }, { status: 400 });

    const formData = await request.formData();
    const professionalId = formData.get("professionalId") as string | null;
    const storageListingId = professionalId ?? crypto.randomUUID();

    const rawMosqueId = formData.get("mosqueId") as string | null;
    const mosqueIsUnlisted = rawMosqueId === "unlisted";
    const mosqueId = (!rawMosqueId || mosqueIsUnlisted) ? null : rawMosqueId;
    const mosque = mosqueId ? await prisma.mosque.findUnique({ where: { id: mosqueId } }) : null;
    if (mosqueId && !mosque) return NextResponse.json({ ok: false, error: "Selected mosque not found." }, { status: 400 });
    const mosqueSuggestionName = (formData.get("mosqueSuggestionName") as string | null)?.trim() ?? "";
    if (mosqueIsUnlisted && mosqueSuggestionName.length < 2) {
      return NextResponse.json({ ok: false, error: "Please enter the mosque name so admins can review it." }, { status: 400 });
    }

    const categoryIds = Array.from(new Set(formData.getAll("categoryIds").filter((value): value is string => typeof value === "string" && Boolean(value))));
    const legacyCategoryId = formData.get("categoryId") as string | null;
    const categoryId = categoryIds[0] ?? legacyCategoryId;
    if (!categoryId) return NextResponse.json({ ok: false, error: "Please select at least one category." }, { status: 400 });
    const selectedCategoryIds = categoryIds.length > 0 ? categoryIds : [categoryId];

    const languages = formData.getAll("languages") as string[];
    const serviceAreaIds = formData.getAll("serviceAreaIds") as string[];

    const photoFile = formData.get("photo") as File | null;
    const logoFile = formData.get("logo") as File | null;
    let photoUrl: string | null = null;
    let logoUrl: string | null = null;
    if (photoFile && photoFile.size > 0) {
      const optimizedPhoto = await optimizeUploadedImage(photoFile, "photo");
      console.info("POST /api/professionals/apply upload", {
        userId: dbUser.id,
        professionalId: storageListingId,
        type: "photo",
        size: photoFile.size,
        mime: photoFile.type,
        optimizedBytes: optimizedPhoto.output.byteLength,
        width: optimizedPhoto.width,
        height: optimizedPhoto.height,
      });
      photoUrl = await uploadToStorage(
        "professional-photos",
        `${dbUser.id}/${storageListingId}/photo.${optimizedPhoto.extension}`,
        optimizedPhoto,
      );
    }
    if (logoFile && logoFile.size > 0) {
      const optimizedLogo = await optimizeUploadedImage(logoFile, "logo");
      console.info("POST /api/professionals/apply upload", {
        userId: dbUser.id,
        professionalId: storageListingId,
        type: "logo",
        size: logoFile.size,
        mime: logoFile.type,
        optimizedBytes: optimizedLogo.output.byteLength,
        width: optimizedLogo.width,
        height: optimizedLogo.height,
      });
      logoUrl = await uploadToStorage(
        "professional-logos",
        `${dbUser.id}/${storageListingId}/logo.${optimizedLogo.extension}`,
        optimizedLogo,
      );
    }

    const mosqueAffiliationConsent = formData.get("mosqueAffiliationConsent") === "true";
    const { CURRENT_TOS_VERSION } = await import("@/lib/constants");
    const now = new Date();
    const data = {
      mosqueId: mosque?.id ?? null,
      categoryId,
      ...(photoUrl && { photoUrl }),
      ...(logoUrl && { logoUrl }),
      businessName: formData.get("businessName") as string || null,
      title: formData.get("title") as string || null,
      bio: formData.get("bio") as string || null,
      yearsOfExperience: formData.get("yearsOfExperience") ? Number(formData.get("yearsOfExperience")) : null,
      qualifications: formData.get("qualifications") as string || null,
      licenses: formData.get("licenses") as string || null,
      languages,
      phone: formData.get("phone") as string || null,
      email: formData.get("email") as string || null,
      website: formData.get("website") as string || null,
      whatsapp: formData.get("whatsapp") as string || null,
      businessAddress: (formData.get("businessAddress") as string | null)?.trim() || null,
      acceptsWalkIns: formData.get("acceptsWalkIns") === "true",
      availability: formData.get("availability") as string || null,
      status: "PENDING" as const,
      mosqueAffiliationConsentAt: (mosque?.id && mosqueAffiliationConsent) ? now : null,
      listingConsentAt: now,
      listingConsentVersion: CURRENT_TOS_VERSION,
    };

    if (professionalId) {
      const existing = await prisma.professional.findFirst({
        where: { id: professionalId, userId: dbUser.id },
        select: {
          id: true,
          isFeatured: true,
          featuredListings: {
            where: { status: "ACTIVE" },
            select: { id: true },
            take: 1,
          },
        },
      });
      if (!existing) return NextResponse.json({ ok: false, error: "Listing not found." }, { status: 404 });
      if (existing.isFeatured || existing.featuredListings.length > 0) {
        const pendingDraft = await prisma.professionalEditDraft.findFirst({
          where: { professionalId, status: "PENDING" },
          select: { id: true },
        });

        if (pendingDraft) {
          await prisma.professionalEditDraft.update({
            where: { id: pendingDraft.id },
            data: {
              data: { ...data, categoryIds: selectedCategoryIds },
              serviceAreaIds,
              adminNote: null,
              submittedAt: new Date(),
            },
          });
        } else {
          await prisma.professionalEditDraft.create({
            data: {
              professionalId,
              data: { ...data, categoryIds: selectedCategoryIds },
              serviceAreaIds,
            },
          });
        }

        revalidatePath("/dashboard");
        revalidatePath("/dashboard/professional");
        revalidatePath("/admin/professionals");
        revalidatePath(`/admin/professionals/${professionalId}`);
        console.info("POST /api/professionals/apply featured draft saved", {
          userId: dbUser.id,
          professionalId,
          durationMs: Date.now() - startedAt,
        });
        return NextResponse.json({ ok: true });
      }

      await prisma.professional.update({
        where: { id: professionalId },
        data: {
          ...data,
          categories: { set: selectedCategoryIds.map((id) => ({ id })) },
          serviceAreas: { set: serviceAreaIds.map((id) => ({ id })) },
        },
      });
      if (mosqueIsUnlisted && mosqueSuggestionName) {
        await prisma.mosqueSuggestion.create({
          data: {
            name: mosqueSuggestionName,
            city: (formData.get("mosqueSuggestionCity") as string | null)?.trim() || null,
            address: (formData.get("mosqueSuggestionAddress") as string | null)?.trim() || null,
            website: (formData.get("mosqueSuggestionWebsite") as string | null)?.trim() || null,
            communityChannelType: "WhatsApp",
            communityChannelName: (formData.get("mosqueSuggestionChannelName") as string | null)?.trim() || null,
            communityChannelLink: (formData.get("mosqueSuggestionChannelLink") as string | null)?.trim() || null,
            notes: (formData.get("mosqueSuggestionNotes") as string | null)?.trim() || null,
            requestedById: dbUser.id,
            professionalId,
          },
        });
      }
    } else {
      await prisma.professional.create({
        data: {
          id: storageListingId,
          ...data,
          userId: dbUser.id,
          categories: { connect: selectedCategoryIds.map((id) => ({ id })) },
          serviceAreas: { connect: serviceAreaIds.map((id) => ({ id })) },
        },
      });
      if (mosqueIsUnlisted && mosqueSuggestionName) {
        await prisma.mosqueSuggestion.create({
          data: {
            name: mosqueSuggestionName,
            city: (formData.get("mosqueSuggestionCity") as string | null)?.trim() || null,
            address: (formData.get("mosqueSuggestionAddress") as string | null)?.trim() || null,
            website: (formData.get("mosqueSuggestionWebsite") as string | null)?.trim() || null,
            communityChannelType: "WhatsApp",
            communityChannelName: (formData.get("mosqueSuggestionChannelName") as string | null)?.trim() || null,
            communityChannelLink: (formData.get("mosqueSuggestionChannelLink") as string | null)?.trim() || null,
            notes: (formData.get("mosqueSuggestionNotes") as string | null)?.trim() || null,
            requestedById: dbUser.id,
            professionalId: storageListingId,
          },
        });
      }
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/professional");
    revalidatePath("/admin/professionals");
    revalidatePath("/admin/mosques");
    console.info("POST /api/professionals/apply success", {
      userId: dbUser.id,
      professionalId: storageListingId,
      hasPhoto: Boolean(photoUrl),
      hasLogo: Boolean(logoUrl),
      durationMs: Date.now() - startedAt,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST /api/professionals/apply:", err);
    const message = err instanceof Error ? err.message : "An unexpected error occurred.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
