import Link from "next/link";
import { MinaretLogo } from "@/components/ui/minaret-logo";
import { Search, Home, ArrowRight } from "lucide-react";

export const metadata = { title: "Page Not Found" };

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-md">
        <Link href="/" className="inline-block mb-8">
          <MinaretLogo withText className="h-8 w-auto" />
        </Link>

        <p className="text-7xl font-bold text-emerald-600 dark:text-emerald-500 mb-3">404</p>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
          Page not found
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
          This page doesn&apos;t exist or may have moved. Try searching for a
          professional, or head back home.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
          >
            <Home className="h-4 w-4" />
            Go home
          </Link>
          <Link
            href="/professionals"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-5 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:border-emerald-300 hover:text-emerald-700 transition-colors"
          >
            <Search className="h-4 w-4" />
            Find a professional
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
