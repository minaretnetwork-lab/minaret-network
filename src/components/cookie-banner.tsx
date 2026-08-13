"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie } from "lucide-react";

const CONSENT_KEY = "mn_cookie_consent";

export type CookieConsent = "all" | "essential" | null;

export function getCookieConsent(): CookieConsent {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(CONSENT_KEY);
    if (v === "all" || v === "essential") return v;
  } catch {}
  return null;
}

export function CookieBanner({ onConsent }: { onConsent?: (consent: CookieConsent) => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (getCookieConsent() === null) setVisible(true);
  }, []);

  function accept(consent: "all" | "essential") {
    try { window.localStorage.setItem(CONSENT_KEY, consent); } catch {}
    setVisible(false);
    onConsent?.(consent);
  }

  if (!visible) return null;

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
              We use <strong className="font-medium text-gray-700 dark:text-gray-300">essential cookies</strong> to keep you signed in and remember your preferences. With your permission, we also use <strong className="font-medium text-gray-700 dark:text-gray-300">analytics cookies</strong> (Google Analytics) to understand how the site is used — no personal data is sold or shared.{" "}
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
