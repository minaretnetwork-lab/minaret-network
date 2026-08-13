import sharp from "sharp";
import { IMAGE_UPLOAD_LIMIT_BYTES, isAcceptedUploadImageType } from "@/lib/upload-image-config";

const MAX_PHOTO_DIMENSION = 2200;
const MAX_LOGO_DIMENSION = 1600;

type ImageVariant = "photo" | "logo";

export function validateSourceImageUpload(file: File, label: string) {
  if (!file || file.size <= 0) {
    throw new Error(`${label} is empty. Please choose an image and try again.`);
  }

  if (!file.type || !file.type.startsWith("image/")) {
    throw new Error(`${label} must be an image file.`);
  }

  if (!isAcceptedUploadImageType(file.type)) {
    throw new Error(`${label} must be a phone or web image such as JPG, PNG, WebP, HEIC, HEIF, or AVIF.`);
  }

  if (file.size > IMAGE_UPLOAD_LIMIT_BYTES) {
    throw new Error(`${label} is too large to upload. Please choose an image under 40 MB.`);
  }
}

export async function optimizeUploadedImage(
  file: File,
  variant: ImageVariant,
): Promise<{
  contentType: "image/webp";
  extension: "webp";
  output: Buffer;
  width: number | null;
  height: number | null;
}> {
  const label = variant === "logo" ? "Business logo" : "Profile photo";
  validateSourceImageUpload(file, label);
  try {
    const input = Buffer.from(await file.arrayBuffer());
    const maxDimension = variant === "logo" ? MAX_LOGO_DIMENSION : MAX_PHOTO_DIMENSION;
    const quality = variant === "logo" ? 90 : 82;

    let pipeline = sharp(input, { failOn: "none" }).rotate();
    const metadata = await pipeline.metadata();
    const hasAlpha = Boolean(metadata.hasAlpha);

    pipeline = pipeline.resize({
      width: maxDimension,
      height: maxDimension,
      fit: "inside",
      withoutEnlargement: true,
    });

    const output = await pipeline
      .webp({
        quality,
        alphaQuality: hasAlpha ? 100 : undefined,
        effort: 4,
        nearLossless: variant === "logo",
      })
      .toBuffer();

    const finalMetadata = await sharp(output).metadata();

    return {
      contentType: "image/webp",
      extension: "webp",
      output,
      width: finalMetadata.width ?? null,
      height: finalMetadata.height ?? null,
    };
  } catch {
    throw new Error(`${label} could not be processed. Please try another image from your photo library.`);
  }
}
