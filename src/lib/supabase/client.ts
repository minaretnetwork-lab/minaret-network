import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseUrlForBrowser } from "./url";

export function createClient() {
  return createBrowserClient(
    getSupabaseUrlForBrowser(),
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
