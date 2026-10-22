import { IMAGE_UPLOAD_LIMIT_BYTES, isAcceptedUploadImageType } from "@/lib/upload-image-config";

export async function prepareProfilePhoto(file: File): Promise<File> {
  if (!file.size || file.size > IMAGE_UPLOAD_LIMIT_BYTES || !isAcceptedUploadImageType(file.type)) {
    throw new Error("Choose a JPG, PNG, WebP, HEIC, HEIF, or AVIF image under 40 MB.");
  }
  const url = URL.createObjectURL(file);
  try {
    const image = new window.Image();
    image.src = url;
    await image.decode();
    const scale = Math.min(1, 1920 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Could not prepare this photo.");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.82));
    if (!blob || blob.size > 3 * 1024 * 1024) throw new Error("Please choose a smaller photo and try again.");
    return new File([blob], "profile-photo.webp", { type: blob.type });
  } catch (error) {
    if (error instanceof Error && error.name !== "EncodingError") throw error;
    throw new Error("Your browser cannot preview this image. Try a JPG, PNG, or WebP photo.");
  } finally { URL.revokeObjectURL(url); }
}
