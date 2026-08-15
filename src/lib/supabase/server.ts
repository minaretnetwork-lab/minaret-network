import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { headers } from "next/headers";
import { getForwardedHostname, getSupabaseUrlForHostname } from "./url";

export async function createClient() {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const forwardedHost = getForwardedHostname((name) => headerStore.get(name));

  return createServerClient(
    getSupabaseUrlForHostname(forwardedHost),
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server component — ignore
          }
        },
      },
    }
  );
}
