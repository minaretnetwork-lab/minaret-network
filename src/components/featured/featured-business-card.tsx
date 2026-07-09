"use client";

import Link from "next/link";
import { MapPin, Star, ArrowRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { trackFeaturedCardClick } from "@/lib/actions/featured";

type FeaturedCardData = {
  id: string;       // listing id
  city: string;
  professional: {
    id: string;
    businessName: string | null;
    bio: string | null;
    photoUrl: string | null;
    user: { firstName: string | null; lastName: string | null; displayName: string | null; avatarUrl: string | null };
    category: { name: string; icon: string | null };
    mosque: { name: string } | null;
    badges: { type: string }[];
  };
};

export function FeaturedBusinessCard({ listing }: { listing: FeaturedCardData }) {
  const { professional, city, id: listingId } = listing;
  const { user, category } = professional;

  const name = professional.businessName
    || user.displayName
    || [user.firstName, user.lastName].filter(Boolean).join(" ")
    || "Business";
  const photoUrl = professional.photoUrl ?? user.avatarUrl;
  const isMosqueAffiliated = professional.badges.some((b) => b.type === "MOSQUE_AFFILIATED");

  async function handleClick() {
    await trackFeaturedCardClick(listingId);
  }

  return (
    <Link
      href={`/professionals/${professional.id}`}
      onClick={handleClick}
      className="group block bg-white dark:bg-white/[0.03] border border-gray-100 dark:border-gray-800 rounded-2xl p-5 hover:border-emerald-200 dark:hover:border-emerald-800 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all duration-200"
    >
      {/* Featured badge */}
      <div className="flex items-start justify-between mb-4">
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
          <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" />
          Featured
        </span>
        {isMosqueAffiliated && professional.mosque && (
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/40 px-2 py-0.5 rounded-full">
            ✓ {professional.mosque.name}
          </span>
        )}
      </div>

      {/* Identity */}
      <div className="flex items-start gap-3.5 mb-3">
        <Avatar className="h-14 w-14 flex-shrink-0 rounded-xl ring-2 ring-offset-2 ring-amber-100 dark:ring-amber-900/30">
          <AvatarImage src={photoUrl ?? undefined} alt={name} className="rounded-xl object-cover" />
          <AvatarFallback className="rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white font-bold text-lg">
            {getInitials(name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-white truncate text-[15px] group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors" style={{ fontFamily: "var(--font-playfair)" }}>
            {name}
          </h3>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-xs">{category.icon}</span>
            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">{category.name}</span>
          </div>
          <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            {city}
          </div>
        </div>
      </div>

      {/* Description */}
      {professional.bio && (
        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed mb-4">
          {professional.bio}
        </p>
      )}

      {/* CTA */}
      <div className="flex items-center justify-end">
        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400 group-hover:gap-1.5 transition-all">
          View Business <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  );
}
