import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  await supabase.auth.signOut();

  // Keep the browser on the origin it used. Reverse proxies may replace the
  // request authority with their loopback target (for example localhost:3220).
  return new NextResponse(null, {
    status: 303,
    headers: { Location: "/?bye=1" },
  });
}
