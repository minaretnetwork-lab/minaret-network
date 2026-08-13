import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { writeAuthDebugLog } from "@/lib/auth-debug-log";
import { getRequestOrigin } from "@/lib/site-origin";

export const runtime = "nodejs";

function safeNext(value: string | null) {
  return value?.startsWith("/") ? value : "/dashboard";
}

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID().slice(0, 8);
  const requestUrl = new URL(request.url);
  const next = safeNext(requestUrl.searchParams.get("next"));
  const siteUrl = getRequestOrigin(request);
  const callbackUrl = new URL("/auth/callback", siteUrl);
  callbackUrl.searchParams.set("next", next);
  const cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }> = [];

  function log(event: string, details: Record<string, unknown> = {}) {
    const payload = {
      requestId,
      host: requestUrl.host,
      publicOrigin: siteUrl,
      next,
      callbackUrl: callbackUrl.toString(),
      ...details,
    };
    console.info("[auth-google]", event, payload);
    writeAuthDebugLog(`google:${event}`, payload);
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(newCookies) {
          cookiesToSet.push(...newCookies);
        },
      },
    }
  );

  log("starting OAuth");
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: callbackUrl.toString() },
  });

  if (error || !data.url) {
    log("OAuth start failed", { error: error?.message ?? "Missing provider URL" });
    return NextResponse.redirect(new URL("/auth/login?error=google_start_failed", siteUrl));
  }

  const response = NextResponse.redirect(data.url);
  cookiesToSet.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });
  log("redirecting to provider", { cookiesSet: cookiesToSet.length });
  return response;
}
