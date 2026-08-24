import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { optimizeUploadedImage } from "@/lib/upload-images";
import { IMAGE_UPLOAD_LIMIT_BYTES } from "@/lib/upload-image-config";
import { normalizePublicAssetUrl } from "@/lib/public-asset-url";

export const runtime = "nodejs";
export const maxDuration = 30;

const BUCKET = "event-images";

async function ensureBucket() {
  const admin = createAdminClient();
  const { error: createErr } = await admin.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: IMAGE_UPLOAD_LIMIT_BYTES,
    allowedMimeTypes: ["image/webp"],
  });
  if (createErr && !createErr.message.includes("already exists")) throw createErr;
  await admin.storage.updateBucket(BUCKET, {
    public: true,
    fileSizeLimit: IMAGE_UPLOAD_LIMIT_BYTES,
    allowedMimeTypes: ["image/webp"],
  });
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("image") as File | null;
    if (!file || file.size === 0) {
      return NextResponse.json({ ok: false, error: "No image provided." }, { status: 400 });
    }

    const optimized = await optimizeUploadedImage(file, "gallery");
    const path = `events/${Date.now()}-${Math.random().toString(36).slice(2)}.webp`;

    await ensureBucket();
    const admin = createAdminClient();
    const { error: uploadErr } = await admin.storage
      .from(BUCKET)
      .upload(path, optimized.output, { upsert: false, contentType: "image/webp" });
    if (uploadErr) throw uploadErr;

    const { data } = admin.storage.from(BUCKET).getPublicUrl(path);
    const url = `${normalizePublicAssetUrl(data.publicUrl)}?t=${Date.now()}`;
    return NextResponse.json({ ok: true, url });
  } catch (err) {
    console.error("[events/upload-image]", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Image upload failed. Please try again." },
      { status: 500 },
    );
  }
}
