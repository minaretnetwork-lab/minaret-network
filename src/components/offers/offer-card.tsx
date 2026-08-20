"use client";

import Image from "next/image";
import { MessageCircle, Phone, Megaphone } from "lucide-react";

type OfferCardProps = {
  offer: {
    id: string;
    title: string;
    description: string;
    imageUrl: string | null;
    tier: string;
    professional: {
      phone: string | null;
      whatsapp: string | null;
      user: { firstName: string | null; lastName: string | null; displayName: string | null };
      category: { name: string; slug: string; icon: string | null } | null;
    };
  };
};

export function OfferCard({ offer }: OfferCardProps) {
  const pro = offer.professional;
  const displayName = pro.user.displayName ?? pro.user.firstName ?? "Professional";
  const phone = pro.phone ?? null;
  const whatsapp = pro.whatsapp ?? pro.phone ?? null;

  return (
    <div className="group h-72 [perspective:1000px]">
      <div className="relative h-full w-full transition-transform duration-500 ease-in-out [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)]">

        {/* ── FRONT: full image ─────────────────────────── */}
        <div className="absolute inset-0 [backface-visibility:hidden] rounded-2xl overflow-hidden shadow-sm">
          {offer.imageUrl ? (
            <Image
              src={offer.imageUrl}
              alt={offer.title}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/30 dark:to-emerald-900/20 flex items-center justify-center">
              <Megaphone className="h-12 w-12 text-emerald-400" />
            </div>
          )}

          {/* Bottom gradient + title */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <p className="text-[10px] font-semibold text-emerald-300 uppercase tracking-wider mb-1">
              {pro.category?.icon} {pro.category?.name ?? "Business"}
            </p>
            <h3 className="text-white font-bold text-base leading-snug line-clamp-2">{offer.title}</h3>
          </div>

          {offer.tier === "FEATURED" && (
            <div className="absolute top-3 left-3 bg-amber-500 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
              Featured
            </div>
          )}

          {/* Flip hint */}
          <div className="absolute top-3 right-3 bg-black/40 text-white/70 text-[10px] px-2 py-1 rounded-full backdrop-blur-sm">
            Hover for details
          </div>
        </div>

        {/* ── BACK: contact details ─────────────────────── */}
        <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm p-5 flex flex-col overflow-hidden">
          <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider mb-2">
            {pro.category?.icon} {pro.category?.name ?? "Business"}
          </p>
          <h3 className="font-bold text-gray-900 dark:text-white text-base leading-snug mb-2">
            {offer.title}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-4 flex-1">
            {offer.description}
          </p>
          <p className="text-xs text-gray-400 mt-3 mb-3">by {displayName}</p>

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
    </div>
  );
}
