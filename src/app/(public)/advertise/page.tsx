import Link from "next/link";
import { ArrowLeft, Sparkles, Star } from "lucide-react";

export const metadata = {
  title: "Feature Your Business | Minaret Network",
  description: "Featured and sponsored placements are coming soon.",
};

export default function AdvertisePage() {
  return (
    <main className="min-h-[70vh] bg-white px-4 py-16 dark:bg-gray-950">
      <div className="container mx-auto max-w-2xl">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-emerald-700 dark:text-gray-400 dark:hover:text-emerald-300"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <section className="rounded-3xl border border-amber-100 bg-amber-50/70 p-8 text-center shadow-sm dark:border-amber-900/40 dark:bg-amber-950/20 sm:p-12">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-white text-amber-700 shadow-sm dark:bg-gray-900 dark:text-amber-300">
            <Star className="h-8 w-8" />
          </div>

          <p className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-700 shadow-sm dark:bg-gray-900 dark:text-amber-300">
            <Sparkles className="h-3.5 w-3.5" />
            Coming soon
          </p>

          <h1 className="text-3xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: "var(--font-playfair)" }}>
            Featured and sponsored placements are not open yet
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-gray-600 dark:text-gray-400">
            We&apos;re still setting up self-serve featured and sponsored placements. For now, Minaret admins will manage featured businesses and sponsored listings directly.
          </p>
        </section>
      </div>
    </main>
  );
}
