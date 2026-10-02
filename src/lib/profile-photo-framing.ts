export type PhotoFraming = { x: number; y: number; zoom: number };

export const DEFAULT_PHOTO_FRAMING: PhotoFraming = { x: 50, y: 50, zoom: 1 };

export function isPhotoFraming(value: unknown): value is PhotoFraming {
  if (!value || typeof value !== "object") return false;
  const frame = value as PhotoFraming;
  return Number.isFinite(frame.x) && frame.x >= 0 && frame.x <= 100 &&
    Number.isFinite(frame.y) && frame.y >= 0 && frame.y <= 100 &&
    Number.isFinite(frame.zoom) && frame.zoom >= 1 && frame.zoom <= 3;
}

export function getPhotoFraming(value: unknown, sourceUrl: string | null): PhotoFraming {
  if (!isPhotoFraming(value) || (value as PhotoFraming & { sourceUrl?: string }).sourceUrl !== sourceUrl) {
    return { ...DEFAULT_PHOTO_FRAMING };
  }
  return { x: value.x, y: value.y, zoom: value.zoom };
}

export function photoOverflow(width: number, height: number, imageRatio: number, zoom: number) {
  const baseWidth = Math.max(width, height * imageRatio);
  const baseHeight = Math.max(height, width / imageRatio);
  return { x: baseWidth * zoom - width, y: baseHeight * zoom - height };
}
