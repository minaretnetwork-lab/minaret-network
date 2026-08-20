const PUBLIC_SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;

function publicOrigin() {
  if (!PUBLIC_SITE_URL) return null;
  try {
    return new URL(PUBLIC_SITE_URL).origin;
  } catch {
    return null;
  }
}

export function normalizePublicAssetUrl(url: string | null | undefined) {
  if (!url) return url ?? null;

  const origin = publicOrigin();
  if (!origin) return url;

  try {
    const parsed = new URL(url);
    const isMinaretStorage =
      parsed.pathname.startsWith("/storage/v1/") &&
      (parsed.hostname === "127.0.0.1" ||
        parsed.hostname === "localhost" ||
        parsed.hostname === "minaretnetwork.ca" ||
        parsed.hostname === "www.minaretnetwork.ca");

    if (!isMinaretStorage) return url;

    return `${origin}${parsed.pathname}${parsed.search}`;
  } catch {
    return url;
  }
}

type ProfessionalPhotoSources = {
  photoUrl?: string | null;
  avatarUrl?: string | null;
};

export function getProfessionalDisplayPhotoUrl({
  photoUrl,
  avatarUrl,
}: ProfessionalPhotoSources) {
  return normalizePublicAssetUrl(photoUrl ?? avatarUrl);
}

