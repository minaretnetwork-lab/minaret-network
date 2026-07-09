import Link from "next/link";
import { MapPin, Star, CheckCircle2, MessageCircle, ArrowRight, Sparkles } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials, buildWhatsAppUrl } from "@/lib/utils";
import type { ProfessionalWithRelations } from "@/types";

interface ProfessionalCardProps {
  professional: ProfessionalWithRelations;
}

export function ProfessionalCard({ professional }: ProfessionalCardProps) {
  const { user, mosque, category, badges, recommendations, serviceAreas } = professional;
  const isSponsored = (professional as typeof professional & { isSponsored?: boolean }).isSponsored === true;

  const name =
    user.displayName ??
    [user.firstName, user.lastName].filter(Boolean).join(" ") ??
    user.email;

  const approvedRecs = recommendations.filter((r) => r.status === "APPROVED").length;
  const photoUrl = professional.photoUrl ?? user.avatarUrl;

  return (
    <div className={`group relative bg-white dark:bg-white/[0.03] border rounded-2xl p-4 sm:p-5 flex flex-col gap-3 sm:gap-4 transition-all duration-200 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:hover:shadow-[0_8px_30px_rgb(0,0,0,0.3)] ${isSponsored ? "border-violet-200 dark:border-violet-800/50 ring-1 ring-violet-100 dark:ring-violet-900/30" : "border-border hover:border-emerald-200 dark:hover:border-emerald-800"}`}>
      {isSponsored && (
        <div className="absolute top-3 right-3">
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800/50 rounded-full px-2 py-0.5">
            <Sparkles className="h-2.5 w-2.5" />
            Sponsored
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start gap-3.5">
        <Avatar className="h-14 w-14 flex-shrink-0 rounded-xl ring-2 ring-offset-2 ring-emerald-100 dark:ring-emerald-900/40">
          <AvatarImage src={photoUrl ?? undefined} alt={name} className="rounded-xl object-cover" />
          <AvatarFallback className="rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 text-white font-bold text-lg">
            {getInitials(name)}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1 pt-0.5">
          <h3 className="font-semibold text-gray-900 dark:text-white truncate text-[15px] leading-snug group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors" style={{ fontFamily: "var(--font-playfair)" }}>
            {name}
          </h3>
          {professional.businessName && (
            <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">{professional.businessName}</p>
          )}
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className="text-xs">{category.icon}</span>
            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">{category.name}</span>
            {professional.yearsOfExperience && (
              <>
                <span className="text-gray-200 dark:text-gray-700">·</span>
                <span className="text-xs text-gray-400">{professional.yearsOfExperience}y exp</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bio */}
      {professional.bio && (
        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
          {professional.bio}
        </p>
      )}

      {/* Badges */}
      {badges.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {badges.map((badge) => {
            if (badge.type === "MOSQUE_AFFILIATED") {
              return (
                <span key={badge.id} className="group/badge relative inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/50 font-medium cursor-default">
                  <CheckCircle2 className="h-2.5 w-2.5 flex-shrink-0" />
                  {mosque ? `Affiliated · ${mosque.name}` : "Mosque Affiliated"}
                  {/* Tooltip */}
                  <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 rounded-lg bg-gray-900 text-white text-[11px] leading-relaxed px-3 py-2 opacity-0 group-hover/badge:opacity-100 transition-opacity duration-150 z-20 shadow-lg text-center">
                    This professional is a member of {mosque?.name ?? "a local mosque"}&apos;s community channel (e.g. WhatsApp group). Affiliation is confirmed by a mosque admin — it does not verify professional credentials or quality of work.
                    <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                  </span>
                </span>
              );
            }
            if (badge.type === "HIGHLY_RECOMMENDED") {
              return (
                <span key={badge.id} className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/50 font-medium">
                  <Star className="h-2.5 w-2.5 fill-current flex-shrink-0" />
                  Highly Recommended
                </span>
              );
            }
            return null;
          })}
        </div>
      )}

      {/* Meta footer */}
      <div className="flex items-center justify-between pt-1 mt-auto border-t border-border/60">
        <div className="flex flex-wrap gap-2 text-xs text-gray-400">
          {serviceAreas && serviceAreas.length > 0 && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {serviceAreas.slice(0, 2).map((a) => a.name).join(", ")}
              {serviceAreas.length > 2 ? ` +${serviceAreas.length - 2}` : ""}
            </span>
          )}
          {approvedRecs > 0 && (
            <span className="flex items-center gap-1 text-amber-500">
              <Star className="h-3 w-3 fill-amber-400" />
              <span className="text-gray-500">{approvedRecs} rec{approvedRecs !== 1 ? "s" : ""}</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {professional.whatsapp && (
            <a
              href={buildWhatsAppUrl(professional.whatsapp)}
              target="_blank"
              rel="noopener noreferrer"
              className="h-8 w-8 flex items-center justify-center rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white transition-colors"
              title="WhatsApp"
            >
              <MessageCircle className="h-3.5 w-3.5" />
            </a>
          )}
          <Link
            href={`/professionals/${professional.id}`}
            className="h-8 flex items-center gap-1 px-3 rounded-lg bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 text-xs font-medium transition-colors"
          >
            View <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
