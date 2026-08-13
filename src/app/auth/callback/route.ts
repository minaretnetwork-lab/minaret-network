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
  const rawNext = searchParams.get("next") ?? "/dashboard";
  const next = rawNext.startsWith("/") ? rawNext : "/dashboard";
  const siteUrl = getRequestOrigin(request);
  const requestId = crypto.randomUUID().slice(0, 8);

  function log(message: string, details: Record<string, unknown> = {}) {
    const payload = {
      requestId,
      host: requestUrl.host,
      publicOrigin: siteUrl,
      hasCode: Boolean(code),
      next,
      ...details,
    };
    console.info("[auth-callback]", message, payload);
    writeAuthDebugLog(message, payload);
  }

  if (code) {
    const redirectUrl = new URL(next, siteUrl);
    const redirectResponse = NextResponse.redirect(redirectUrl);
    let cookiesSet = 0;
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesSet += cookiesToSet.length;
            cookiesToSet.forEach(({ name, value, options }) => {
              redirectResponse.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    log("exchanging OAuth code");
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      log("OAuth exchange failed", { error: error.message });
    }

    if (!error && data.user?.email) {
      log("OAuth exchange succeeded", {
        email: data.user.email,
        supabaseUserId: data.user.id.slice(0, 8),
      });
      const mosqueSlug = process.env.NEXT_PUBLIC_DEFAULT_MOSQUE_SLUG ?? "al-falah";
      const mosque = await prisma.mosque.findUnique({ where: { slug: mosqueSlug } });
      const fullName = data.user.user_metadata.full_name as string | undefined;
      const firstName = fullName?.split(" ")[0] ?? null;
      const lastName = fullName?.split(" ").slice(1).join(" ") ?? null;
      const avatarUrl = data.user.user_metadata.avatar_url as string | undefined;

      const existingBySupabaseId = await prisma.user.findUnique({
        where: { supabaseId: data.user.id },
      });

      if (existingBySupabaseId) {
        log("matched existing user by Supabase id", {
          dbUserId: existingBySupabaseId.id.slice(0, 8),
        });
        await prisma.user.update({
          where: { id: existingBySupabaseId.id },
          data: {
            emailVerified: !!data.user.email_confirmed_at,
            avatarUrl: existingBySupabaseId.avatarUrl ?? avatarUrl ?? null,
          },
        });
      } else {
        const existingByEmail = await prisma.user.findUnique({
          where: { email: data.user.email },
        });

        if (existingByEmail) {
          log("matched existing user by email", {
            dbUserId: existingByEmail.id.slice(0, 8),
          });
          await prisma.user.update({
            where: { id: existingByEmail.id },
            data: {
              supabaseId: data.user.id,
              emailVerified: !!data.user.email_confirmed_at,
              firstName: existingByEmail.firstName ?? firstName,
              lastName: existingByEmail.lastName ?? lastName,
              displayName: existingByEmail.displayName ?? fullName ?? null,
              avatarUrl: existingByEmail.avatarUrl ?? avatarUrl ?? null,
              mosqueId: existingByEmail.mosqueId ?? mosque?.id,
            },
          });
        } else {
          log("creating user from OAuth", { email: data.user.email });
          await prisma.user.create({
            data: {
              supabaseId: data.user.id,
              email: data.user.email,
              firstName,
              lastName,
              displayName: fullName ?? null,
              avatarUrl: avatarUrl ?? null,
              mosqueId: mosque?.id,
              emailVerified: !!data.user.email_confirmed_at,
            },
          });
        }
      }

      log("redirecting after OAuth", { redirectTo: redirectUrl.toString() });
      log("OAuth cookies attached to redirect", { cookiesSet });
      return redirectResponse;
    }
  }

  log("redirecting to login after OAuth failure");
  return NextResponse.redirect(new URL("/auth/login?error=auth_failed", siteUrl));
}
