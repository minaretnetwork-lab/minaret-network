import type { Metadata, Viewport } from "next";
import { Lora, Inter } from "next/font/google";
import { Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { FlashToast } from "@/components/flash-toast";
import { IdleTimeout } from "@/components/idle-timeout";
import "./globals.css";

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

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
      className={`${lora.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
        <IdleTimeout />
        <Toaster position="bottom-right" />
        <Suspense>
          <FlashToast />
        </Suspense>
      </body>
    </html>
  );
}
