import Link from "next/link";
import { ArrowRight, Megaphone } from "lucide-react";
import { cookies } from "next/headers";
import { getActiveOffersForHomepage } from "@/lib/actions/offers";
import { OfferCard } from "@/components/offers/offer-card";

type Offer = Awaited<ReturnType<typeof getActiveOffersForHomepage>>[number];

export async function CommunityOffersSection() {
  const cookieStore = await cookies();
  const region = cookieStore.get("mn_region")?.value;

  let offers: Offer[] = [];
  try {
    const raw = await getActiveOffersForHomepage(region);
    // Featured first, then by start date
    offers = [...raw].sort((a, b) => {
      if (a.tier === "FEATURED" && b.tier !== "FEATURED") return -1;
      if (a.tier !== "FEATURED" && b.tier === "FEATURED") return 1;
      return 0;
    });
  } catch {
    return null;
  }

  return (
    <section className="container mx-auto px-4 lg:px-6 py-12">
      <div className="flex items-end justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Megaphone className="h-4 w-4 text-emerald-600" />
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600">
              Community Offers
            </p>
          </div>
          <h2
            className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white"
            style={{ fontFamily: "var(--font-lora)" }}
          >
            Deals from community businesses
          </h2>
        </div>
        <div className="hidden sm:flex items-center gap-4">
          <Link
            href="/offers"
            className="flex items-center gap-1 text-sm font-medium text-emerald-700 hover:text-emerald-800 dark:text-emerald-400"
          >
            Browse all <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/dashboard/offers"
            className="flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400"
          >
            Post an offer
          </Link>
        </div>
      </div>

      {offers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 py-16 text-center">
          <Megaphone className="h-10 w-10 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 font-medium mb-2">No active offers yet</p>
          <p className="text-sm text-gray-400 mb-5">Be the first to reach the community.</p>
          <Link
            href="/dashboard/offers"
            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
          >
            Post a Community Offer
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {offers.map((offer) => (
            <OfferCard key={offer.id} offer={offer} />
          ))}
        </div>
      )}

      {offers.length > 0 && (
        <p className="mt-5 text-[11px] text-gray-400 dark:text-gray-600 leading-relaxed max-w-2xl">
          <strong className="font-semibold text-gray-500 dark:text-gray-500">Disclaimer:</strong> Community Offers are posted by community members. Minaret Network does not verify business registration, food handling licences, permits, or regulatory compliance. Transactions are at the user&apos;s own discretion. Minaret Network is not a party to any transaction.{" "}
          <Link href="/offers" className="underline underline-offset-2 hover:text-gray-600">See all offers</Link>
        </p>
      )}

      {offers.length > 0 && (
        <div className="mt-6 flex items-center justify-center gap-4 sm:hidden">
          <Link href="/offers" className="text-sm text-emerald-700 dark:text-emerald-400 hover:underline">
            Browse all offers →
          </Link>
          <span className="text-gray-300">·</span>
          <Link href="/dashboard/offers" className="text-sm text-gray-500 hover:underline">
            Post an offer
          </Link>
        </div>
      )}
    </section>
  );
}
