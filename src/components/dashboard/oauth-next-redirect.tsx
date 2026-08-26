"use client";

import { useEffect } from "react";

const TTL_MS = 20 * 60 * 1000; // 20 minutes

export function OAuthNextRedirect() {
  useEffect(() => {
    try {
      const raw = localStorage.getItem("mn_oauth_next");
      if (!raw) return;
      let next = raw;
      let ts = 0;
      try {
        const parsed = JSON.parse(raw);
        next = parsed.next;
        ts = parsed.ts ?? 0;
      } catch {
        // plain string — no timestamp, treat as stale
        localStorage.removeItem("mn_oauth_next");
        return;
      }
      if (!next || !next.startsWith("/")) {
        localStorage.removeItem("mn_oauth_next");
        return;
      }
      if (Date.now() - ts > TTL_MS) {
        localStorage.removeItem("mn_oauth_next");
        return;
      }
      localStorage.removeItem("mn_oauth_next");
      window.location.replace(next);
    } catch {}
  }, []);

  return null;
}
