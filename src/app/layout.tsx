import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "@fontsource-variable/lora";
import { Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { FlashToast } from "@/components/flash-toast";
import { LazyIdleTimeout } from "@/components/lazy-idle-timeout";
import { LazyAssistantBubble } from "@/components/ai/lazy-assistant-bubble";
import { GoogleAnalyticsWithConsent } from "@/components/google-analytics";
import { CookieBanner } from "@/components/cookie-banner";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

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
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
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
      <head>
        {/* Anti-flash: apply stored theme before first paint */}
        <script dangerouslySetInnerHTML={{ __html: `
(function(){try{var t=localStorage.getItem('mn-theme');var dark=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme:dark)').matches);if(dark)document.documentElement.classList.add('dark');}catch(e){}})();
        `.trim() }} />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider>
          {children}
          <LazyAssistantBubble />
          <LazyIdleTimeout />
          <Toaster position="bottom-right" />
          <Suspense>
            <FlashToast />
          </Suspense>
          <CookieBanner />
          <GoogleAnalyticsWithConsent />
        </ThemeProvider>
      </body>
    </html>
  );
}
