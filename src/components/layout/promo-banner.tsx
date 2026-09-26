"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { X, Sparkles } from "lucide-react";

const BANNER_KEY = "promo-banner-launch-dismissed";
const DISMISS_EVENT = "promo-banner-dismissed";

function subscribeToDismissal(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(DISMISS_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(DISMISS_EVENT, callback);
  };
}

function isVisible() {
  return localStorage.getItem(BANNER_KEY) !== "1";
}

export function PromoBanner() {
  const visible = useSyncExternalStore(subscribeToDismissal, isVisible, () => false);

  if (!visible) return null;

  function dismiss() {
    localStorage.setItem(BANNER_KEY, "1");
    window.dispatchEvent(new Event(DISMISS_EVENT));
  }

  return (
    <div className="relative z-50 bg-[#CE1126] text-white text-sm">
      <div className="container mx-auto px-4 py-2 flex items-center justify-center gap-2 text-center pr-10">
        <Sparkles className="h-3.5 w-3.5 flex-shrink-0 text-emerald-200" aria-hidden="true" />
        <p className="leading-snug">
          <strong className="font-semibold">Launch offer:</strong>{" "}
          Featured Business &amp; Sponsored Listings are{" "}
          <strong className="font-semibold">currently free</strong> — one spot per business.{" "}
          <Link
            href="/advertise"
            className="underline underline-offset-2 hover:text-emerald-100 transition-colors"
          >
            Apply now →
          </Link>
        </p>
      </div>
      <button
        onClick={dismiss}
        aria-label="Dismiss offer banner"
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 hover:bg-[#a50e1e] transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
