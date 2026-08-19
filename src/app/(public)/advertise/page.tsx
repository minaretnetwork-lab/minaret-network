import Link from "next/link";
import { ArrowLeft, Sparkles, Star, Building2, Tag, Megaphone } from "lucide-react";

export const metadata = {
  title: "Advertise | Minaret Network",
  description: "Featured Business and Sponsored Listings are free until Oct 31, 2026. One spot per business.",
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

        {/* Free offer banner */}
        <div className="mb-8 rounded-2xl bg-emerald-700 px-6 py-5 text-white">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 mt-0.5 flex-shrink-0 text-emerald-200" />
            <div>
              <p className="font-semibold text-base">Limited-time: free until Oct 31, 2026</p>
              <p className="text-sm text-emerald-100 mt-0.5">
                Featured Business and Sponsored Listings are completely free during our launch period.
                One placement per business — businesses already listed cannot reapply for a second month until the free period ends.
              </p>
            </div>
          </div>
        </div>

        <h1
          className="text-3xl font-bold text-gray-900 dark:text-white mb-3"
          style={{ fontFamily: "var(--font-lora)" }}
        >
          Grow your visibility in the GTA Muslim community
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-10 leading-relaxed">
          Two ways to get in front of mosque-affiliated professionals and community members actively searching for services like yours.
        </p>

        <div className="space-y-5">
          {/* Featured Business */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400">
                <Star className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Featured Business</h2>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                    Free until Oct 31
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-4">
                  Your business card featured prominently on the Minaret Network homepage, seen by every visitor.
                  Includes your name, category, mosque affiliation, and contact details.
                </p>
                <ul className="space-y-1.5 text-sm text-gray-600 dark:text-gray-300 mb-5">
                  {[
                    "Homepage placement — maximum visibility",
                    "Your photo, category, and mosque affiliation shown",
                    "30-day listing, subject to admin approval",
                    "$29.99/month from Nov 1, 2026 — free during launch",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/auth/login?next=/dashboard/featured"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 transition-colors"
                >
                  Apply for Featured Business
                </Link>
              </div>
            </div>
          </div>

          {/* Sponsored Listing */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400">
                <Tag className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Sponsored Listing</h2>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                    Free until Oct 31
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-4">
                  Pin your listing to the top of a specific category and service area — shown first whenever someone searches for your profession in your area.
                </p>
                <ul className="space-y-1.5 text-sm text-gray-600 dark:text-gray-300 mb-5">
                  {[
                    "Top-of-search placement in your category and area",
                    "Sponsored badge on your listing card",
                    "30-day listing, subject to admin approval",
                    "$19.99/month from Nov 1, 2026 — free during launch",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-violet-500 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/auth/login?next=/dashboard/promote"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-violet-700 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-800 transition-colors"
                >
                  Apply for Sponsored Listing
                </Link>
              </div>
            </div>
          </div>
        </div>

          {/* Community Offers */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
                <Megaphone className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Community Offer</h2>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                    Free until Oct 31
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-4">
                  Post a time-limited promotion — a deal, discount, or special offer — visible to community members in your region. Great for food, services, and one-time promotions.
                </p>
                <ul className="space-y-1.5 text-sm text-gray-600 dark:text-gray-300 mb-5">
                  {[
                    "Weekend (up to 3 days) — $4.99, free until Oct 31",
                    "Standard (4–7 days) — $9.99, free until Oct 31",
                    "Featured (8–30 days) — $19.99, shown first, free until Oct 31",
                    "Approved professionals only — admin reviewed",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/auth/login?next=/dashboard/offers"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 transition-colors"
                >
                  Post a Community Offer
                </Link>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-8 text-xs text-gray-400 dark:text-gray-600 text-center leading-relaxed">
          All placements are reviewed and approved by Minaret Network admins.
          One placement per business per month. Misrepresentation may result in removal.
        </p>
      </div>
    </main>
  );
}
