"use client";

import { useSyncExternalStore } from "react";
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
  const consent = useCookieConsent();

  function accept(consent: "all" | "essential") {
    try { window.localStorage.setItem(CONSENT_KEY, consent); } catch {}
    window.dispatchEvent(new Event(CONSENT_EVENT));
    onConsent?.(consent);
  }

  if (consent !== null) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[200] p-4 sm:p-6">
      <div className="mx-auto max-w-3xl rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:gap-6">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/40">
            <Cookie className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">We use cookies</p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              We use <strong className="font-medium text-gray-700 dark:text-gray-300">essential cookies</strong> to keep you signed in and remember your preferences. With your permission, analytics cookies enable Google Analytics and Contentsquare, including heatmaps and session replay, to help us understand how the site is used. Choosing Essential only prevents these tools from loading, and we do not sell personal data.{" "}
              <Link href="/privacy" className="underline hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors">
                Privacy Policy
              </Link>
            </p>
          </div>
          <div className="flex flex-shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={() => accept("essential")}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Essential only
            </button>
            <button
              type="button"
              onClick={() => accept("all")}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-700"
            >
              Accept all
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
