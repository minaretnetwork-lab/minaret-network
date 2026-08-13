export const IMAGE_UPLOAD_LIMIT_BYTES = 40 * 1024 * 1024;

export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "image/avif",
  "image/jpg",
];

export function isAcceptedUploadImageType(mimeType: string) {
  return ACCEPTED_IMAGE_TYPES.includes(mimeType.toLowerCase());
}
