import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { prisma } from "@/lib/prisma";
import { writeAuthDebugLog } from "@/lib/auth-debug-log";
import { getRequestOrigin } from "@/lib/site-origin";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const { searchParams } = requestUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const rawToken = searchParams.get("token");   // {{ .Token }} fallback
  const emailParam = searchParams.get("email"); // {{ .Email }} fallback
  const type = searchParams.get("type");
  const rawNext = searchParams.get("next") ?? "/dashboard";
  const cookieNext = request.cookies.get("mn_oauth_next")?.value ?? "";
  const next = (rawNext !== "/dashboard" && rawNext.startsWith("/"))
    ? rawNext
    : (cookieNext.startsWith("/") ? cookieNext : "/dashboard");
  const requestHost = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? requestUrl.host;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || getRequestOrigin(request);
  const requestId = crypto.randomUUID().slice(0, 8);

  function log(message: string, details: Record<string, unknown> = {}) {
    const payload = {
      requestId,
      host: requestHost,
      publicOrigin: siteUrl,
      hasCode: Boolean(code),
      hasTokenHash: Boolean(tokenHash),
      type,
      next,
      ...details,
    };
    console.info("[auth-callback]", message, payload);
    writeAuthDebugLog(message, payload);
  }

  function makeSupabase(redirectResponse: NextResponse) {
    let cookiesSet = 0;
    const client = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll(); },
          setAll(cookiesToSet) {
            cookiesSet += cookiesToSet.length;
            cookiesToSet.forEach(({ name, value, options }) => {
              redirectResponse.cookies.set(name, value, options);
            });
          },
        },
      }
    );
    return { client, getCookiesSet: () => cookiesSet };
  }

  async function upsertDbUser(user: { id: string; email: string; email_confirmed_at?: string | null; user_metadata: Record<string, unknown> }): Promise<{ needsConsent: boolean }> {
    const mosqueSlug = process.env.NEXT_PUBLIC_DEFAULT_MOSQUE_SLUG ?? "al-falah";
    const mosque = await prisma.mosque.findUnique({ where: { slug: mosqueSlug } });
    const fullName = user.user_metadata.full_name as string | undefined;
    const firstName = fullName?.split(" ")[0] ?? null;
    const lastName = fullName?.split(" ").slice(1).join(" ") ?? null;
    const avatarUrl = user.user_metadata.avatar_url as string | undefined;

    const existingBySupabaseId = await prisma.user.findUnique({ where: { supabaseId: user.id }, select: { id: true, avatarUrl: true, tosVersion: true } });
    if (existingBySupabaseId) {
      log("matched existing user by Supabase id", { dbUserId: existingBySupabaseId.id.slice(0, 8) });
      await prisma.user.update({
        where: { id: existingBySupabaseId.id },
        data: { emailVerified: !!user.email_confirmed_at, avatarUrl: existingBySupabaseId.avatarUrl ?? avatarUrl ?? null },
      });
      return { needsConsent: !existingBySupabaseId.tosVersion };
    }
    const existingByEmail = await prisma.user.findUnique({ where: { email: user.email }, select: { id: true, firstName: true, lastName: true, displayName: true, avatarUrl: true, mosqueId: true, tosVersion: true } });
    if (existingByEmail) {
      log("matched existing user by email", { dbUserId: existingByEmail.id.slice(0, 8) });
      await prisma.user.update({
        where: { id: existingByEmail.id },
        data: {
          supabaseId: user.id,
          emailVerified: !!user.email_confirmed_at,
          firstName: existingByEmail.firstName ?? firstName,
          lastName: existingByEmail.lastName ?? lastName,
          displayName: existingByEmail.displayName ?? fullName ?? null,
          avatarUrl: existingByEmail.avatarUrl ?? avatarUrl ?? null,
          mosqueId: existingByEmail.mosqueId ?? mosque?.id,
        },
      });
      return { needsConsent: !existingByEmail.tosVersion };
    } else {
      log("creating user from OAuth", { email: user.email });
      await prisma.user.create({
        data: {
          supabaseId: user.id,
          email: user.email,
          firstName,
          lastName,
          displayName: fullName ?? null,
          avatarUrl: avatarUrl ?? null,
          mosqueId: mosque?.id,
          emailVerified: !!user.email_confirmed_at,
        },
      });
      return { needsConsent: true };
    }
  }

  const redirectUrl = new URL(next, siteUrl);
  const redirectResponse = NextResponse.redirect(redirectUrl);
  const { client: supabase, getCookiesSet } = makeSupabase(redirectResponse);

  // ── Path 1a: token_hash (Supabase {{ .TokenHash }} — cross-device, no PKCE cookie needed) ──
  if (tokenHash && type) {
    log("verifying token_hash", { type });
    const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: type as never });
    if (!error && data.user?.email) {
      log("token_hash verified", { email: data.user.email, cookiesSet: getCookiesSet() });
      await upsertDbUser({ ...data.user, email: data.user.email });
      if (type === "signup") {
        const successUrl = new URL("/auth/email-verified", siteUrl);
        successUrl.searchParams.set("next", next);
        const successResponse = NextResponse.redirect(successUrl);
        redirectResponse.cookies.getAll().forEach((c) => successResponse.cookies.set(c.name, c.value));
        return successResponse;
      }
      return redirectResponse;
    }
    log("token_hash verification failed", { error: error?.message });
    return NextResponse.redirect(new URL("/auth/forgot-password?error=link_expired", siteUrl));
  }

  // ── Path 1b: raw token + email (Supabase {{ .Token }} + {{ .Email }} — fallback template) ──
  if (rawToken && emailParam && type) {
    log("verifying raw token", { type, email: emailParam });
    const { data, error } = await supabase.auth.verifyOtp({
      email: emailParam,
      token: rawToken,
      type: type as never,
    });
    if (!error && data.user?.email) {
      log("raw token verified", { email: data.user.email, cookiesSet: getCookiesSet() });
      await upsertDbUser({ ...data.user, email: data.user.email });
      return redirectResponse;
    }
    log("raw token verification failed", { error: error?.message });
    return NextResponse.redirect(new URL("/auth/forgot-password?error=link_expired", siteUrl));
  }

  // ── Path 2: PKCE code (OAuth, same-browser email flows) ──
  if (code) {
    log("exchanging OAuth code");
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) log("OAuth exchange failed", { error: error.message });

    if (!error && data.user?.email) {
      log("OAuth exchange succeeded", { email: data.user.email, cookiesSet: getCookiesSet() });
      const { needsConsent } = await upsertDbUser({ ...data.user, email: data.user.email });
      redirectResponse.cookies.set("mn_last_google_email", data.user.email, {
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
        path: "/",
        httpOnly: false,
      });
      // Clear the OAuth next cookie now that we've consumed it
      redirectResponse.cookies.set("mn_oauth_next", "", { maxAge: 0, path: "/" });
      if (needsConsent) {
        const consentUrl = new URL("/auth/re-consent", siteUrl);
        consentUrl.searchParams.set("next", next);
        const consentResponse = NextResponse.redirect(consentUrl);
        redirectResponse.cookies.getAll().forEach((cookie) => consentResponse.cookies.set(cookie.name, cookie.value));
        log("redirecting to re-consent", { redirectTo: consentUrl.toString() });
        return consentResponse;
      }
      log("redirecting after OAuth", { redirectTo: redirectUrl.toString() });
      return redirectResponse;
    }

    // PKCE failed — likely cross-device (email opened in different browser).
    // If the next destination implies a signup flow, send to verify-email; otherwise forgot-password.
    log("PKCE exchange failed, redirecting based on context");
    const isSignupFlow = next === "/dashboard" || next.startsWith("/dashboard");
    const failUrl = isSignupFlow
      ? new URL("/auth/verify-email?error=link_expired", siteUrl)
      : new URL("/auth/forgot-password?error=link_expired", siteUrl);
    return NextResponse.redirect(failUrl);
  }

  log("no valid auth params in callback");
  return NextResponse.redirect(new URL("/auth/verify-email?error=link_expired", siteUrl));
}
