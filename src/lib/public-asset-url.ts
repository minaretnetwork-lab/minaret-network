const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

function supabaseOrigin() {
  if (!SUPABASE_URL) return null;
  try {
    return new URL(SUPABASE_URL).origin;
  } catch {
    return null;
  }
}

export function normalizePublicAssetUrl(url: string | null | undefined) {
  if (!url) return url ?? null;

  const origin = supabaseOrigin();
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

