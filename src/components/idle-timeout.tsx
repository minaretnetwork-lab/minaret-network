"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const IDLE_MS = 60 * 60 * 1000; // 60 minutes
const EVENTS = ["mousemove", "mousedown", "keydown", "scroll", "touchstart", "click"] as const;

export function IdleTimeout() {
  const router = useRouter();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const supabase = createClient();

    async function isLoggedIn() {
      const { data } = await supabase.auth.getSession();
      return !!data.session;
    }

    async function signOutIdle() {
      if (!(await isLoggedIn())) return;
      await supabase.auth.signOut();
      router.push("/auth/login?reason=idle");
    }

    function reset() {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(signOutIdle, IDLE_MS);
    }

    // Only start tracking if user is logged in
    isLoggedIn().then((loggedIn) => {
      if (!loggedIn) return;
      reset();
      EVENTS.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    });

    return () => {
      if (timer.current) clearTimeout(timer.current);
      EVENTS.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [router]);

  return null;
}
