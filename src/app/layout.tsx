import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "@fontsource-variable/lora";
import { Suspense } from "react";
import Script from "next/script";
import { Toaster } from "@/components/ui/sonner";
import { FlashToast } from "@/components/flash-toast";
import { LazyIdleTimeout } from "@/components/lazy-idle-timeout";
import { LazyAssistantBubble } from "@/components/ai/lazy-assistant-bubble";
import "./globals.css";

const GA_MEASUREMENT_ID = "G-6NWWGPL859";
const enableGoogleAnalytics = process.env.NEXT_PUBLIC_SITE_URL === "https://minaretnetwork.ca";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "Minaret Network",
    template: "%s | Minaret Network",
  },
  description:
    "Find professionals from your mosque community across the GTA.",
  keywords: ["professionals", "mosque", "community", "affiliated", "Minaret Network", "GTA"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
        <LazyAssistantBubble />
        <LazyIdleTimeout />
        <Toaster position="bottom-right" />
        <Suspense>
          <FlashToast />
        </Suspense>
        {enableGoogleAnalytics && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_MEASUREMENT_ID}');
              `}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
