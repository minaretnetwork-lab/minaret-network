import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Megaphone, MessageCircle, Phone } from "lucide-react";
import { cookies } from "next/headers";
import { getActiveOffersForHomepage } from "@/lib/actions/offers";

type Offer = Awaited<ReturnType<typeof getActiveOffersForHomepage>>[number];

function OfferCard({ offer }: { offer: Offer }) {
  const pro = offer.professional;
  const displayName = pro.user.displayName ?? pro.user.firstName ?? "Professional";
  const phone = pro.phone ?? null;
  const whatsapp = pro.whatsapp ?? pro.phone ?? null;

  return (
    <div className="relative flex flex-col bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
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
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
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

        {/* Contact actions */}
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
}

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {offers.slice(0, 6).map((offer) => (
            <OfferCard key={offer.id} offer={offer} />
          ))}
        </div>
      )}

      {offers.length > 0 && (
        <p className="mt-5 text-[11px] text-gray-400 dark:text-gray-600 leading-relaxed max-w-2xl">
          <strong className="font-semibold text-gray-500 dark:text-gray-500">Disclaimer:</strong> Community Offers are posted by community members. Minaret Network does not verify business registration, food-handling licenses, permits, or regulatory compliance. Transact at your own discretion — Minaret Network is not a party to any transaction and assumes no liability.{" "}
          <Link href="/offers" className="underline underline-offset-2 hover:text-gray-600">See all offers</Link>
        </p>
      )}

      <div className="mt-6 flex items-center justify-center gap-4 sm:hidden">
        <Link href="/offers" className="text-sm text-emerald-700 dark:text-emerald-400 hover:underline">
          Browse all offers →
        </Link>
        <span className="text-gray-300">·</span>
        <Link href="/dashboard/offers" className="text-sm text-gray-500 hover:underline">
          Post an offer
        </Link>
      </div>
    </section>
  );
}
