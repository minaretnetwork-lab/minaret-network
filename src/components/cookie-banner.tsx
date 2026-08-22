"use client";

import { useSyncExternalStore, useState, useEffect } from "react";
import Link from "next/link";
import { Cookie } from "lucide-react";

// Version the key whenever the disclosed analytics vendors or purposes change.
// This prevents an older consent choice from silently authorizing a new processor.
const CONSENT_KEY = "mn_cookie_consent_v2";
const CONSENT_EVENT = "mn-cookie-consent-change";

export type CookieConsent = "all" | "essential" | null;

export function getCookieConsent(): CookieConsent {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(CONSENT_KEY);
    if (v === "all" || v === "essential") return v;
  } catch {}
  return null;
}

function subscribeToCookieConsent(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(CONSENT_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(CONSENT_EVENT, callback);
  };
}

export function useCookieConsent() {
  return useSyncExternalStore(subscribeToCookieConsent, getCookieConsent, () => null);
}

export function CookieBanner({ onConsent }: { onConsent?: (consent: CookieConsent) => void }) {
  // Start as non-null (hidden) so nothing renders before we read localStorage.
  // After mount we set the real value — if null, banner appears; otherwise stays hidden.
  const [consent, setConsent] = useState<CookieConsent>("essential");

  useEffect(() => {
    setConsent(getCookieConsent());
    const handler = () => setConsent(getCookieConsent());
    window.addEventListener("storage", handler);
    window.addEventListener(CONSENT_EVENT, handler);
    return () => {
      window.removeEventListener("storage", handler);
      window.removeEventListener(CONSENT_EVENT, handler);
    };
  }, []);

  function accept(choice: "all" | "essential") {
    try { window.localStorage.setItem(CONSENT_KEY, choice); } catch {}
    setConsent(choice);
    window.dispatchEvent(new Event(CONSENT_EVENT));
    onConsent?.(choice);
  }

  if (consent !== null) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[200] px-3 pb-3 sm:px-6 sm:pb-6"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <div className="mx-auto max-w-3xl rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900">
        <div className="flex items-center gap-3 px-4 py-3 sm:gap-5 sm:px-5 sm:py-4">
          {/* Icon — hidden on mobile to save vertical space */}
          <div className="hidden sm:flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/40">
            <Cookie className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
              <span className="font-semibold text-gray-900 dark:text-white">Cookies: </span>
              We use essential cookies to keep you signed in, and optional analytics cookies to improve the site.{" "}
              <Link href="/privacy" className="underline hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors whitespace-nowrap">
                Privacy Policy
              </Link>
            </p>
          </div>

          {/* Buttons — always in a row */}
          <div className="flex flex-shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => accept("essential")}
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 whitespace-nowrap"
            >
              Essential only
            </button>
            <button
              type="button"
              onClick={() => accept("all")}
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 whitespace-nowrap"
            >
              Accept all
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
