import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Upsert user record
      const mosqueSlug = process.env.NEXT_PUBLIC_DEFAULT_MOSQUE_SLUG ?? "al-falah";
      const mosque = await prisma.mosque.findUnique({ where: { slug: mosqueSlug } });

      await prisma.user.upsert({
        where: { supabaseId: data.user.id },
        update: { emailVerified: !!data.user.email_confirmed_at },
        create: {
          supabaseId: data.user.id,
          email: data.user.email!,
          firstName: data.user.user_metadata.full_name?.split(" ")[0] ?? null,
          lastName: data.user.user_metadata.full_name?.split(" ").slice(1).join(" ") ?? null,
          displayName: data.user.user_metadata.full_name ?? null,
          avatarUrl: data.user.user_metadata.avatar_url ?? null,
          mosqueId: mosque?.id,
          emailVerified: !!data.user.email_confirmed_at,
        },
      });

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`);
}
