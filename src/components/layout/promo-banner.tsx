"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { X, Sparkles } from "lucide-react";

const BANNER_KEY = "promo-banner-free-oct2026-dismissed";
const FREE_UNTIL = new Date("2026-11-01T00:00:00.000Z");

export function PromoBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(BANNER_KEY);
    const expired = new Date() >= FREE_UNTIL;
    if (!dismissed && !expired) setVisible(true);
  }, []);

  if (!visible) return null;

  function dismiss() {
    localStorage.setItem(BANNER_KEY, "1");
    setVisible(false);
  }

  return (
    <div className="relative z-50 bg-emerald-700 text-white text-sm">
      <div className="container mx-auto px-4 py-2 flex items-center justify-center gap-2 text-center pr-10">
        <Sparkles className="h-3.5 w-3.5 flex-shrink-0 text-emerald-200" aria-hidden="true" />
        <p className="leading-snug">
          <strong className="font-semibold">Limited-time offer:</strong>{" "}
          Featured Business &amp; Sponsored Listings are{" "}
          <strong className="font-semibold">free until Oct 31, 2026</strong> — one spot per business.{" "}
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
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 hover:bg-emerald-600 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
