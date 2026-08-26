"use client";

import { useEffect } from "react";

export function OAuthNextRedirect() {
  useEffect(() => {
    try {
      const next = localStorage.getItem("mn_oauth_next");
      console.log("[OAuthNextRedirect] mn_oauth_next =", next);
      if (next && next.startsWith("/")) {
        localStorage.removeItem("mn_oauth_next");
        window.location.replace(next);
      }
    } catch (e) {
      console.error("[OAuthNextRedirect] error", e);
    }
  }, []);

  return null;
}
