import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

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
  return `${data.publicUrl}?t=${Date.now()}`;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ ok: false, error: "You must be signed in to apply." }, { status: 401 });

    const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } });
    if (!dbUser) return NextResponse.json({ ok: false, error: "Your account was not found. Please sign out and back in." }, { status: 400 });

    const formData = await request.formData();

    const rawMosqueId = formData.get("mosqueId") as string | null;
    const mosqueId = (!rawMosqueId || rawMosqueId === "unlisted") ? null : rawMosqueId;
    const mosque = mosqueId ? await prisma.mosque.findUnique({ where: { id: mosqueId } }) : null;
    if (mosqueId && !mosque) return NextResponse.json({ ok: false, error: "Selected mosque not found." }, { status: 400 });

    const categoryId = formData.get("categoryId") as string;
    if (!categoryId) return NextResponse.json({ ok: false, error: "Please select a category." }, { status: 400 });

    const languages = formData.getAll("languages") as string[];
    const serviceAreaIds = formData.getAll("serviceAreaIds") as string[];

    const photoFile = formData.get("photo") as File | null;
    const logoFile = formData.get("logo") as File | null;
    let photoUrl: string | null = null;
    let logoUrl: string | null = null;
    if (photoFile && photoFile.size > 0) {
      const ext = photoFile.name.split(".").pop() ?? "jpg";
      photoUrl = await uploadToStorage("professional-photos", `${dbUser.id}/photo.${ext}`, photoFile);
    }
    if (logoFile && logoFile.size > 0) {
      const ext = logoFile.name.split(".").pop() ?? "png";
      logoUrl = await uploadToStorage("professional-logos", `${dbUser.id}/logo.${ext}`, logoFile);
    }

    await prisma.professional.upsert({
      where: { userId: dbUser.id },
      update: {
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
        availability: formData.get("availability") as string || null,
        serviceAreas: { set: serviceAreaIds.map((id) => ({ id })) },
        status: "PENDING",
      },
      create: {
        userId: dbUser.id,
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
        availability: formData.get("availability") as string || null,
        serviceAreas: { connect: serviceAreaIds.map((id) => ({ id })) },
      },
    });

    revalidatePath("/dashboard");
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST /api/professionals/apply:", err);
    const message = err instanceof Error ? err.message : "An unexpected error occurred.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
