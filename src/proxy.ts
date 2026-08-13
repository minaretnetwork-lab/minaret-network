import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { getRequestOrigin } from "@/lib/site-origin";

export async function proxy(request: NextRequest) {
  const forwardedHost = request.headers.get("x-forwarded-host") ?? request.headers.get("host");

  if (forwardedHost === "www.minaretnetwork.ca") {
    const origin = getRequestOrigin(request);
    const url = new URL(`${request.nextUrl.pathname}${request.nextUrl.search}`, origin);
    return NextResponse.redirect(url, 308);
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
