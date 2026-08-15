export function normalizeSiteOrigin(origin: string) {
  try {
    const url = new URL(origin);
    if (url.hostname === "www.staging.minaretnetwork.ca") {
      url.hostname = "staging.minaretnetwork.ca";
    }
    return url.toString().replace(/\/$/, "");
  } catch {
    return origin.replace(/\/$/, "");
  }
}

type RequestLike = {
  headers: {
    get(name: string): string | null;
  };
  nextUrl?: {
    origin: string;
    host: string;
  };
  url?: string;
};

export function getRequestOrigin(request: RequestLike) {
  const forwardedHost = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";

  if (forwardedHost) {
    return normalizeSiteOrigin(`${forwardedProto}://${forwardedHost}`);
  }

  if (request.nextUrl?.origin) {
    return normalizeSiteOrigin(request.nextUrl.origin);
  }

  if (request.url) {
    return normalizeSiteOrigin(new URL(request.url).origin);
  }

  return normalizeSiteOrigin("https://staging.minaretnetwork.ca");
}
