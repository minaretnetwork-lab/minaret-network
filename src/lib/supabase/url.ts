import { CONSENT_HOST } from "@/lib/constants";

const defaultSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

function trimTrailingSlash(value: string) {
  return value.replace(/\/$/, "");
}

function normalizeHostname(hostname: string) {
  return hostname.trim().toLowerCase().replace(/:\d+$/, "");
}

function isConsentHost(hostname: string) {
  const normalized = normalizeHostname(hostname);
  return normalized === CONSENT_HOST || normalized === `www.${CONSENT_HOST}`;
}

export function getSupabaseUrlForHostname(hostname: string) {
  if (isConsentHost(hostname)) {
    return `https://${CONSENT_HOST}`;
  }

  return trimTrailingSlash(defaultSupabaseUrl);
}

export function getSupabaseUrlForBrowser() {
  if (typeof window === "undefined") {
    return trimTrailingSlash(defaultSupabaseUrl);
  }

  return getSupabaseUrlForHostname(window.location.hostname);
}

export function getForwardedHostname(getHeader: (name: string) => string | null, fallback = "") {
  return normalizeHostname(
    getHeader("x-forwarded-host") ??
      getHeader("host") ??
      fallback,
  );
}
