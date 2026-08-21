"use client";

import Link from "next/link";
import { Star } from "lucide-react";
import { getInitials } from "@/lib/utils";
import { trackFeaturedCardClick } from "@/lib/actions/featured";

type FeaturedCardData = {
  id: string;
  city: string;
  professional: {
    id: string;
    businessName: string | null;
    photoUrl: string | null;
    logoUrl: string | null;
    user: { firstName: string | null; lastName: string | null; displayName: string | null; avatarUrl: string | null };
    category: { name: string; slug: string; icon: string | null };
    mosque: { name: string } | null;
    badges: { type: string }[];
  };
};

export function FeaturedBusinessCard({ listing }: { listing: FeaturedCardData }) {
  const { professional, id: listingId } = listing;
  const { user } = professional;

  const name = professional.businessName
    || user.displayName
    || [user.firstName, user.lastName].filter(Boolean).join(" ")
    || "Business";

  // Logo takes priority; fall back to profile photo then user avatar
  const logoUrl = professional.logoUrl ?? null;
  const photoUrl = professional.photoUrl ?? user.avatarUrl ?? null;
  const imageUrl = logoUrl ?? photoUrl;
  const isLogo = Boolean(logoUrl);

  const initials = getInitials(name);

  async function handleClick() {
    await trackFeaturedCardClick(listingId);
  }

  return (
    <Link
      href={`/professionals/${professional.id}`}
      onClick={handleClick}
      className="group block relative aspect-square rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2"
    >
      {/* Image or placeholder */}
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={name}
          className={[
            "absolute inset-0 w-full h-full transition-transform duration-500 group-hover:scale-[1.04]",
            isLogo
              ? "object-contain p-6 bg-white dark:bg-gray-950"
              : "object-cover object-center",
          ].join(" ")}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
          <span className="text-white font-bold text-4xl select-none">{initials}</span>
        </div>
      )}

      {/* Bottom gradient + name */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/40 to-transparent pt-10 pb-4 px-4">
        <p className="text-white font-bold text-[15px] leading-tight drop-shadow-sm line-clamp-2">
          {name}
        </p>
      </div>

      {/* Featured badge */}
      <div className="absolute top-2.5 left-2.5">
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-amber-800 bg-amber-50/90 backdrop-blur-sm border border-amber-200 rounded-full px-2 py-0.5 shadow-sm">
          <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" />
          Featured
        </span>
      </div>
    </Link>
  );
}
