import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { getRequestOrigin } from "@/lib/site-origin";

export async function proxy(request: NextRequest) {
  const forwardedHost = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const normalizedHost = forwardedHost?.toLowerCase();
  const apexHosts = new Set(["minaretnetwork.ca", "www.minaretnetwork.ca"]);

  if (normalizedHost === "www.staging.minaretnetwork.ca") {
    const origin = getRequestOrigin(request);
    const url = new URL(`${request.nextUrl.pathname}${request.nextUrl.search}`, origin);
    return NextResponse.redirect(url, 308);
  }

  if (normalizedHost && apexHosts.has(normalizedHost) && request.nextUrl.pathname !== "/upgrades-in-progress") {
    const url = new URL("http://127.0.0.1:3220/upgrades-in-progress");
    return NextResponse.rewrite(url);
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
