"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function OAuthNextRedirect() {
  const router = useRouter();

  useEffect(() => {
    try {
      const next = localStorage.getItem("mn_oauth_next");
      if (next && next.startsWith("/")) {
        localStorage.removeItem("mn_oauth_next");
        router.replace(next);
      }
    } catch {}
  }, [router]);

  return null;
}
