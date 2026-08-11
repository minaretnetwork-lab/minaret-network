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
    const isLocalSupabase =
      (parsed.hostname === "127.0.0.1" || parsed.hostname === "localhost") &&
      parsed.pathname.startsWith("/storage/v1/");

    if (!isLocalSupabase) return url;

    return `${origin}${parsed.pathname}${parsed.search}`;
  } catch {
    return url;
  }
}

