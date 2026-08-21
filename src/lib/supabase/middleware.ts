import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const { pathname } = request.nextUrl;
  const forwardedHost = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? request.nextUrl.host;
  const protectedRoutes = ["/dashboard", "/admin", "/auth/update-password"];
  const isProtected = protectedRoutes.some((r) => pathname === r || pathname.startsWith(r + "/"));

  function clearSupabaseCookies(response: NextResponse) {
    request.cookies
      .getAll()
      .filter((cookie) => cookie.name.startsWith("sb-") || cookie.name.includes("supabase"))
      .forEach((cookie) => response.cookies.delete(cookie.name));
    return response;
  }

  function redirectToLogin() {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("redirectTo", pathname);
    console.info("[auth-middleware] redirecting protected route to login", {
      path: pathname,
      host: forwardedHost,
      hasSupabaseCookies: request.cookies
        .getAll()
        .some((cookie) => cookie.name.startsWith("sb-") || cookie.name.includes("supabase")),
    });
    return clearSupabaseCookies(NextResponse.redirect(url));
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  let user: User | null = null;
  try {
    const result = await supabase.auth.getUser();
    user = result.data.user;
  } catch {
    if (isProtected) {
      return redirectToLogin();
    }
    return clearSupabaseCookies(supabaseResponse);
  }

  if (!user && isProtected) {
    return redirectToLogin();
  }

  // Block unverified email/password accounts from protected routes.
  // Google OAuth users always have email_confirmed_at set by Google, so this
  // only affects users who signed up with email/password and skipped verification.
  if (user && isProtected && !user.email_confirmed_at) {
    const provider = user.app_metadata?.provider as string | undefined;
    if (provider === "email") {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/verify-email";
      url.search = "?blocked=1";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
