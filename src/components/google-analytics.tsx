"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { getCookieConsent, CookieBanner, type CookieConsent } from "./cookie-banner";

const GA_ID = "G-6NWWGPL859";

export function GoogleAnalyticsWithConsent() {
  const [consent, setConsent] = useState<CookieConsent>(null);

  useEffect(() => {
    setConsent(getCookieConsent());
  }, []);

  function handleConsent(c: CookieConsent) {
    setConsent(c);
  }

  return (
    <>
      <CookieBanner onConsent={handleConsent} />
      {consent === "all" && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_ID}');
            `}
          </Script>
          {/* Contentsquare — session replay, heatmaps, Voice of Customer feedback */}
          <Script
            src="https://t.contentsquare.net/uxa/8f1b36459e042.js"
            strategy="afterInteractive"
          />
        </>
      )}
    </>
  );
}
