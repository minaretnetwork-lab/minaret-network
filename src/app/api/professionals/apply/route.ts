import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { normalizePublicAssetUrl } from "@/lib/public-asset-url";

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

function validateImageUpload(file: File, label: string) {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error(`${label} must be a JPG, PNG, or WebP image.`);
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error(`${label} must be under 5 MB.`);
  }
}

async function uploadToStorage(bucket: string, path: string, file: File): Promise<string> {
  const admin = createAdminClient();
  const { error: bucketErr } = await admin.storage.createBucket(bucket, {
    public: true,
    fileSizeLimit: 5242880,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  });
  if (bucketErr && !bucketErr.message.includes("already exists")) throw bucketErr;
  const { error: uploadErr } = await admin.storage
    .from(bucket)
    .upload(path, file, { upsert: true, contentType: file.type });
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

    const categoryId = formData.get("categoryId") as string;
    if (!categoryId) return NextResponse.json({ ok: false, error: "Please select a category." }, { status: 400 });

    const languages = formData.getAll("languages") as string[];
    const serviceAreaIds = formData.getAll("serviceAreaIds") as string[];

    const photoFile = formData.get("photo") as File | null;
    const logoFile = formData.get("logo") as File | null;
    let photoUrl: string | null = null;
    let logoUrl: string | null = null;
    if (photoFile && photoFile.size > 0) {
      validateImageUpload(photoFile, "Profile photo");
      const ext = photoFile.name.split(".").pop() ?? "jpg";
      console.info("POST /api/professionals/apply upload", {
        userId: dbUser.id,
        professionalId: storageListingId,
        type: "photo",
        size: photoFile.size,
        mime: photoFile.type,
      });
      photoUrl = await uploadToStorage("professional-photos", `${dbUser.id}/${storageListingId}/photo.${ext}`, photoFile);
    }
    if (logoFile && logoFile.size > 0) {
      validateImageUpload(logoFile, "Business logo");
      const ext = logoFile.name.split(".").pop() ?? "png";
      console.info("POST /api/professionals/apply upload", {
        userId: dbUser.id,
        professionalId: storageListingId,
        type: "logo",
        size: logoFile.size,
        mime: logoFile.type,
      });
      logoUrl = await uploadToStorage("professional-logos", `${dbUser.id}/${storageListingId}/logo.${ext}`, logoFile);
    }

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
    };

    if (professionalId) {
      const existing = await prisma.professional.findFirst({
        where: { id: professionalId, userId: dbUser.id },
        select: { id: true },
      });
      if (!existing) return NextResponse.json({ ok: false, error: "Listing not found." }, { status: 404 });

      await prisma.professional.update({
        where: { id: professionalId },
        data: {
          ...data,
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
