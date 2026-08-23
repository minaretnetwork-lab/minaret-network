"use client";

import { useSyncExternalStore } from "react";
import Script from "next/script";
import { useCookieConsent } from "./cookie-banner";

const GA_ID = "G-6NWWGPL859";

const subscribeToHostname = () => () => {};

function isAnalyticsHost() {
  const hostname = window.location.hostname.toLowerCase();
  return (
    hostname === "minaretnetwork.ca" ||
    hostname === "www.minaretnetwork.ca" ||
    hostname === "minaret-network-cyan.vercel.app" ||
    hostname === "localhost" ||
    hostname === "127.0.0.1"
  );
}

export function GoogleAnalyticsWithConsent() {
  const consent = useCookieConsent();
  const analyticsHost = useSyncExternalStore(subscribeToHostname, isAnalyticsHost, () => false);

  if (!analyticsHost) return null;

  return (
    <>
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
