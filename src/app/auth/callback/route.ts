import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const rawNext = searchParams.get("next") ?? "/dashboard";
  const next = rawNext.startsWith("/") ? rawNext : "/dashboard";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://127.0.0.1:3220";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user?.email) {
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

      return NextResponse.redirect(new URL(next, siteUrl));
    }
  }

  return NextResponse.redirect(new URL("/auth/login?error=auth_failed", siteUrl));
}
