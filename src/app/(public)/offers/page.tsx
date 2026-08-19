export const dynamic = "force-dynamic";

import Link from "next/link";
import Image from "next/image";
import { Megaphone, MessageCircle, Phone, Info } from "lucide-react";
import { cookies } from "next/headers";
import { getActiveOffers } from "@/lib/actions/offers";

export const metadata = {
  title: "Community Offers | Minaret Network",
  description: "Browse time-limited deals and promotions posted by GTA mosque community businesses.",
};

export default async function OffersPage({
  searchParams,
}: {
  searchParams: Promise<{ all?: string }>;
}) {
  const { all } = await searchParams;
  const showAll = all === "1";

  const cookieStore = await cookies();
  const region = showAll ? undefined : cookieStore.get("mn_region")?.value;

  let offers: Awaited<ReturnType<typeof getActiveOffers>> = [];
  try {
    offers = await getActiveOffers({ limit: 48, region });
    offers = [...offers].sort((a, b) => {
      if (a.tier === "FEATURED" && b.tier !== "FEATURED") return -1;
      if (a.tier !== "FEATURED" && b.tier === "FEATURED") return 1;
      return 0;
    });
  } catch {
    // fall through with empty list
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="container mx-auto px-4 lg:px-6 py-12">

        {/* Disclaimer banner */}
        <div className="mb-8 flex gap-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-4">
          <Info className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            <strong className="font-semibold text-gray-700 dark:text-gray-300">Community notice:</strong> Offers on this page are posted by community members. Minaret Network does not verify business registration, food-handling licenses, food premises permits, or any other regulatory compliance. Home-based food vendors may not hold a commercial food premises license under Ontario&apos;s Food Premises Regulation (O. Reg. 493/17). You are encouraged to confirm licensing and food safety compliance before purchasing. Minaret Network is not a party to any transaction and assumes no liability for products, services, or any harm arising from them.
          </p>
        </div>

        {/* Header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Megaphone className="h-4 w-4 text-emerald-600" />
              <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600">
                Community Offers
              </p>
            </div>
            <h1
              className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white"
              style={{ fontFamily: "var(--font-lora)" }}
            >
              Deals from the community
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              Time-limited promotions posted by GTA mosque community businesses.
            </p>
            {region && !showAll && (
              <div className="flex items-center gap-2 mt-3">
                <span className="inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400 text-xs font-semibold px-3 py-1 rounded-full">
                  {region}
                </span>
                <Link
                  href="/offers?all=1"
                  className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 underline underline-offset-2"
                >
                  View all regions
                </Link>
              </div>
            )}
            {showAll && (
              <div className="flex items-center gap-2 mt-3">
                <span className="inline-flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-semibold px-3 py-1 rounded-full">
                  All regions
                </span>
                {region && (
                  <Link
                    href="/offers"
                    className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 underline underline-offset-2"
                  >
                    Show my region only
                  </Link>
                )}
              </div>
            )}
          </div>
          <Link
            href="/dashboard/offers"
            className="hidden sm:inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
          >
            Post an offer
          </Link>
        </div>

        {/* Grid */}
        {offers.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 py-24 text-center">
            <Megaphone className="h-12 w-12 text-gray-300 mx-auto mb-5" />
            <p className="text-gray-500 dark:text-gray-400 font-medium mb-2 text-lg">
              No active offers {region && !showAll ? `in ${region}` : "right now"}
            </p>
            <p className="text-sm text-gray-400 mb-6">
              {region && !showAll
                ? "No businesses have posted offers in your area yet."
                : "Check back soon — community businesses post offers regularly."}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {region && !showAll && (
                <Link
                  href="/offers?all=1"
                  className="inline-flex items-center gap-1.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  View offers from all regions
                </Link>
              )}
              <Link
                href="/dashboard/offers"
                className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
              >
                Post a Community Offer
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {offers.map((offer) => {
              const pro = offer.professional;
              const displayName = pro.user.displayName ?? pro.user.firstName ?? "Professional";
              const phone = pro.phone ?? null;
              const whatsapp = pro.whatsapp ?? pro.phone ?? null;

              return (
                <div
                  key={offer.id}
                  className="relative flex flex-col bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  {offer.tier === "FEATURED" && (
                    <div className="absolute top-3 left-3 z-10 bg-amber-500 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                      Featured
                    </div>
                  )}

                  {offer.imageUrl ? (
                    <div className="relative w-full h-44 flex-shrink-0">
                      <Image
                        src={offer.imageUrl}
                        alt={offer.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-24 flex-shrink-0 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/30 dark:to-emerald-900/20 flex items-center justify-center">
                      <Megaphone className="h-8 w-8 text-emerald-400" />
                    </div>
                  )}

                  <div className="flex flex-col flex-1 p-4">
                    <p className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider mb-1">
                      {pro.category?.icon} {pro.category?.name ?? "Business"}
                    </p>
                    <h3 className="font-bold text-gray-900 dark:text-white text-base leading-snug mb-1.5">
                      {offer.title}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-3 mb-3 flex-1">
                      {offer.description}
                    </p>

                    <p className="text-xs text-gray-400 mb-3">by {displayName}</p>

                    <div className="flex gap-2">
                      {whatsapp && (
                        <a
                          href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-2 px-3 rounded-lg transition-colors"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                          WhatsApp
                        </a>
                      )}
                      {phone && (
                        <a
                          href={`tel:${phone.replace(/\D/g, "")}`}
                          className="flex-1 flex items-center justify-center gap-1.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-xs font-semibold py-2 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                          <Phone className="h-3.5 w-3.5" />
                          Call
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-8 text-center sm:hidden">
          <Link
            href="/dashboard/offers"
            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
          >
            Post a Community Offer
          </Link>
        </div>
      </div>
    </div>
  );
}
