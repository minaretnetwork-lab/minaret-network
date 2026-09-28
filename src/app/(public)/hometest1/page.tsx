import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight } from "lucide-react";
import { HeroSearch } from "@/components/home/hero-search";
import { FeaturedSection } from "@/components/featured/featured-section";
import { CommunityOffersSection } from "@/components/offers/community-offers-section";

export const metadata: Metadata = {
  title: "Find a professional",
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
};

const popularSearches = [
  { label: "Plumber", category: "plumber" },
  { label: "Family doctor", category: "doctor" },
  { label: "Accountant", category: "accountant" },
  { label: "Realtor", category: "realtor" },
];

export default function HomeTestPage() {
  return (
    <div>
      <section className="border-b border-emerald-900/10 bg-[#f4f8f4] px-4 py-12 dark:border-emerald-800/40 dark:bg-[#0b1c12] sm:py-16 lg:py-20">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-gray-950 dark:text-white sm:text-5xl lg:text-6xl" style={{ fontFamily: "var(--font-lora)" }}>
              Find a professional near you.
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-gray-700 dark:text-gray-200 sm:text-lg">
              Search mosque-affiliated professionals by service, name, and city.
            </p>
          </div>

          <div className="mt-8 rounded-3xl border border-gray-200 bg-white p-5 shadow-[0_14px_40px_rgba(7,45,26,0.08)] sm:p-8 dark:border-gray-700">
            <p className="mb-4 text-sm font-semibold text-gray-900">Search the directory</p>
            <div className="flex justify-center">
              <HeroSearch light showLocationHint={false} analyticsPath="/hometest1" />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm">
            <span className="font-medium text-gray-600 dark:text-gray-300">Popular searches</span>
            {popularSearches.map(({ label, category }) => (
              <Link key={category} href={`/professionals?category=${category}`} className="font-semibold text-emerald-800 underline decoration-emerald-300 underline-offset-4 hover:text-emerald-950 dark:text-emerald-300 dark:decoration-emerald-700 dark:hover:text-emerald-200">
                {label}
              </Link>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 border-t border-emerald-900/10 pt-6 text-sm font-semibold dark:border-emerald-200/20">
            <Link href="/professionals" className="inline-flex items-center gap-1 text-emerald-800 hover:underline dark:text-emerald-300">
              Browse all professionals <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link href="/categories" className="inline-flex items-center gap-1 text-emerald-800 hover:underline dark:text-emerald-300">
              Explore categories <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <Suspense fallback={null}><FeaturedSection /></Suspense>
      <Suspense fallback={null}><CommunityOffersSection /></Suspense>
    </div>
  );
}
