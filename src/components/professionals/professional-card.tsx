"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { MapPin, Star, CheckCircle2, MessageCircle, Sparkles, ChevronDown, Mail, Phone, Send, Loader2 } from "lucide-react";
import { CategoryIcon } from "@/components/ui/category-icon";
import { ContactGateModal } from "@/components/ui/contact-gate-modal";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials, buildWhatsAppUrl } from "@/lib/utils";
import { getProfessionalDisplayPhotoUrl } from "@/lib/public-asset-url";
import type { ProfessionalWithRelations } from "@/types";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface ProfessionalCardProps {
  professional: ProfessionalWithRelations;
  isLoggedIn?: boolean;
}

function RatingBreakdown({ recommendations }: { recommendations: { rating: number }[] }) {
  const total = recommendations.length;
  const counts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: recommendations.filter((r) => r.rating === star).length,
  }));

  return (
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-30 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-3 w-44 pointer-events-none">
      {counts.map(({ star, count }) => {
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        return (
          <div key={star} className="flex items-center gap-1.5 mb-1 last:mb-0">
            <span className="text-[11px] text-gray-500 w-4 text-right flex-shrink-0">{star}</span>
            <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400 flex-shrink-0" />
            <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-400 rounded-full"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-[11px] text-gray-400 w-4 text-right flex-shrink-0">{count}</span>
          </div>
        );
      })}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white dark:border-t-gray-900" />
    </div>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 32 32" className={className} fill="currentColor">
      <path d="M16.04 4C9.43 4 4.06 9.34 4.06 15.92c0 2.1.55 4.15 1.6 5.96L4 28l6.28-1.64a12.04 12.04 0 0 0 5.76 1.46C22.65 27.82 28 22.48 28 15.92S22.65 4 16.04 4Zm0 21.8c-1.82 0-3.6-.49-5.15-1.42l-.37-.22-3.73.98.99-3.62-.24-.37a9.75 9.75 0 0 1-1.49-5.23c0-5.46 4.48-9.9 9.99-9.9 5.5 0 9.98 4.44 9.98 9.9 0 5.45-4.48 9.88-9.98 9.88Zm5.48-7.4c-.3-.15-1.78-.87-2.05-.97-.28-.1-.48-.15-.68.15-.2.3-.78.97-.96 1.17-.18.2-.35.22-.65.07-.3-.15-1.27-.46-2.42-1.48-.9-.8-1.5-1.78-1.67-2.08-.18-.3-.02-.46.13-.6.14-.14.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.68-1.63-.93-2.23-.25-.58-.5-.5-.68-.51h-.58c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.87 1.22 3.07c.15.2 2.1 3.18 5.08 4.46.7.3 1.26.48 1.69.62.71.23 1.36.2 1.87.12.57-.08 1.78-.72 2.03-1.42.25-.7.25-1.3.18-1.42-.08-.13-.28-.2-.58-.35Z" />
    </svg>
  );
}

function ActionTooltip({ label }: { label: string }) {
  return (
    <span className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-950 px-2 py-1 text-[11px] font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover/action:opacity-100 group-focus-visible/action:opacity-100">
      {label}
      <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-gray-950" />
    </span>
  );
}

export function ProfessionalCard({ professional, isLoggedIn = true }: ProfessionalCardProps) {
  const router = useRouter();
  const { user, mosque, category, badges, recommendations, serviceAreas } = professional;
  const displayCategories = professional.categories?.length ? professional.categories : [category];
  const isSponsored = (professional as typeof professional & { isSponsored?: boolean }).isSponsored === true;
  const isFeatured = (professional as typeof professional & { isFeatured?: boolean }).isFeatured === true;
  const distanceKm = professional.fallbackDistanceKm;
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [messageIssue, setMessageIssue] = useState("");
  const [messageError, setMessageError] = useState("");
  const [messageLoading, setMessageLoading] = useState(false);

  const name =
    user.displayName ??
    [user.firstName, user.lastName].filter(Boolean).join(" ") ??
    user.email;

  const approvedRecs = recommendations.filter((r) => r.status === "APPROVED");
  const recCount = approvedRecs.length;
  const avgRating = recCount > 0
    ? Math.round((approvedRecs.reduce((sum, r) => sum + r.rating, 0) / recCount) * 10) / 10
    : null;

  const photoUrl = getProfessionalDisplayPhotoUrl({
    photoUrl: professional.photoUrl,
    avatarUrl: user.avatarUrl,
  });
  const profileUrl = `/professionals/${professional.id}`;
  const whatsappPhone = professional.whatsapp || professional.phone;
  const defaultLocation = serviceAreas[0]?.name ?? "";
  const mapsUrl = professional.businessAddress
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(professional.businessAddress)}`
    : null;

  function openExternalContact(url: string) {
    window.location.href = url;
  }

  async function startDirectMessage() {
    const issue = messageIssue.trim();
    if (issue.length < 8) {
      setMessageError("Add a little detail so the professional knows what this is about.");
      return;
    }

    setMessageLoading(true);
    setMessageError("");
    try {
      const response = await fetch("/api/ai/start-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ professionalId: professional.id, issue, location: defaultLocation }),
      });
      const payload = await response.json();
      if (response.status === 401) {
        router.push(`/auth/login?redirectTo=${encodeURIComponent(profileUrl)}`);
        return;
      }
      if (!response.ok) throw new Error(payload.error ?? "Could not start the chat.");
      router.push(payload.chatUrl);
    } catch (err) {
      setMessageError(err instanceof Error ? err.message : "Could not start the chat.");
    } finally {
      setMessageLoading(false);
    }
  }

  return (
    <div
      className={`group relative cursor-pointer bg-white dark:bg-white/[0.03] border rounded-2xl p-4 sm:p-5 flex flex-col gap-3 sm:gap-4 transition-all duration-200 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:hover:shadow-[0_8px_30px_rgb(0,0,0,0.3)] ${isSponsored ? "border-violet-200 dark:border-violet-800/50 ring-1 ring-violet-100 dark:ring-violet-900/30" : "border-border hover:border-emerald-200 dark:hover:border-emerald-800"}`}
    >
      <Link
        href={profileUrl}
        aria-label={`View ${name}'s professional profile`}
        className="absolute inset-0 z-10 rounded-2xl"
      />
      {(isSponsored || isFeatured) && (
        <div className="pointer-events-none absolute top-3 right-3 z-20 flex flex-col items-end gap-1">
          {isSponsored && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800/50 rounded-full px-2 py-0.5">
              <Sparkles className="h-2.5 w-2.5" />
              Sponsored
            </span>
          )}
          {isFeatured && !isSponsored && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-full px-2 py-0.5">
              <Star className="h-2.5 w-2.5 fill-current" />
              Featured
            </span>
          )}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start gap-3.5">
        <Avatar className="size-24 flex-shrink-0 rounded-xl ring-2 ring-offset-2 ring-emerald-100 dark:ring-emerald-900/40">
          <AvatarImage src={photoUrl ?? undefined} alt={name} className="rounded-xl object-cover" />
          <AvatarFallback className="rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 text-white font-bold text-3xl">
            {getInitials(name)}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1 pt-0.5">
          <Link href={profileUrl} className="relative z-20 block">
            <h3 className="font-semibold text-gray-900 dark:text-white truncate text-[15px] leading-snug hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors" style={{ fontFamily: "var(--font-lora)" }}>
              {name}
            </h3>
          </Link>
          {professional.businessName && (
            <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">{professional.businessName}</p>
          )}
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 mt-1.5">
            {displayCategories.slice(0, 2).map((displayCategory) => (
              <Link key={displayCategory.id} href={`/professionals?category=${displayCategory.slug}`} className="relative z-20 flex items-center gap-1.5 hover:underline">
                <CategoryIcon slug={displayCategory.slug} className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
                <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">{displayCategory.name}</span>
              </Link>
            ))}
            {displayCategories.length > 2 && (
              <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">+{displayCategories.length - 2}</span>
            )}
            {professional.yearsOfExperience && (
              <>
                <span className="text-gray-200 dark:text-gray-700">·</span>
                <span className="text-xs text-gray-400">{professional.yearsOfExperience}y exp</span>
              </>
            )}
          </div>

          {/* Star rating row */}
          {avgRating !== null && (
            <div className="flex items-center gap-1 mt-1.5">
              <Link
                href={`/professionals/${professional.id}#recommendations`}
                className="relative z-20 flex items-center gap-1 hover:underline"
              >
                <span className="text-xs font-semibold text-amber-600">{avgRating.toFixed(1)}</span>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`h-3 w-3 ${s <= Math.round(avgRating) ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200 dark:fill-gray-700 dark:text-gray-700"}`}
                    />
                  ))}
                </div>
                <span className="text-xs text-gray-400">({recCount})</span>
              </Link>
              <div className="relative">
                <button
                  type="button"
                  onMouseEnter={() => setShowBreakdown(true)}
                  onMouseLeave={() => setShowBreakdown(false)}
                  className="relative z-20 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  aria-label="Rating breakdown"
                >
                  <ChevronDown className="h-3 w-3" />
                </button>
                {showBreakdown && <RatingBreakdown recommendations={approvedRecs} />}
              </div>
            </div>
          )}
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
                <span key={badge.id} className="group/badge relative inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/50 font-medium">
                  <CheckCircle2 className="h-2.5 w-2.5 flex-shrink-0" />
                  {mosque ? (
                    <>
                      Affiliated ·{" "}
                      <Link
                        href={`/professionals?mosque=${mosque.slug}`}
                        className="relative z-20 hover:underline"
                      >
                        {mosque.name}
                      </Link>
                    </>
                  ) : "Mosque Affiliated"}
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
      <div className="space-y-2 pt-3 mt-auto border-t border-border/60">
        <div className="flex flex-wrap gap-2 text-xs text-gray-400">
          {serviceAreas && serviceAreas.length > 0 && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {serviceAreas.slice(0, 2).map((a) => a.name).join(", ")}
              {serviceAreas.length > 2 ? ` +${serviceAreas.length - 2}` : ""}
              {typeof distanceKm === "number" && (
                <span className="font-medium text-emerald-600">({distanceKm.toFixed(1)} km)</span>
              )}
            </span>
          )}
          {mapsUrl && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(event) => event.stopPropagation()}
              className="relative z-20 flex items-center gap-1 text-emerald-700 hover:underline dark:text-emerald-400"
            >
              <MapPin className="h-3 w-3" />
              Business address{professional.acceptsWalkIns ? " · walk-ins" : ""}
            </a>
          )}
        </div>

        <div className="relative z-20 flex items-center justify-end gap-1.5">
          {isLoggedIn ? (
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setMessageDialogOpen(true);
              }}
              className="group/action relative h-8 w-8 flex items-center justify-center rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white transition-colors"
              aria-label={`Message ${name}`}
            >
              <ActionTooltip label="Message" />
              <MessageCircle className="h-3.5 w-3.5" />
            </button>
          ) : (
            <ContactGateModal
              professionalId={professional.id}
              professionalName={name}
              mode="message"
              location={defaultLocation}
              trigger={
                <div
                  className="group/action relative h-8 w-8 flex items-center justify-center rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white transition-colors"
                  aria-label={`Message ${name}`}
                >
                  <ActionTooltip label="Message" />
                  <MessageCircle className="h-3.5 w-3.5" />
                </div>
              }
            />
          )}
          {whatsappPhone && (
            isLoggedIn ? (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  openExternalContact(buildWhatsAppUrl(whatsappPhone));
                }}
                className="group/action relative h-8 w-8 flex items-center justify-center rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white transition-colors"
                aria-label={`WhatsApp ${name}`}
              >
                <ActionTooltip label="WhatsApp" />
                <WhatsAppIcon className="h-4 w-4" />
              </button>
            ) : (
              <ContactGateModal
                professionalId={professional.id}
                professionalName={name}
                trigger={
                  <div
                    className="group/action relative h-8 w-8 flex items-center justify-center rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white transition-colors"
                    aria-label={`WhatsApp ${name}`}
                  >
                    <ActionTooltip label="WhatsApp" />
                    <WhatsAppIcon className="h-4 w-4" />
                  </div>
                }
              />
            )
          )}
          {professional.email && (
            <a
              href={`mailto:${professional.email}`}
              onClick={(event) => event.stopPropagation()}
              className="group/action relative h-8 w-8 flex items-center justify-center rounded-lg border border-emerald-200 text-emerald-700 hover:bg-emerald-50 transition-colors"
              aria-label={`Email ${name}`}
            >
              <ActionTooltip label="Email" />
              <Mail className="h-3.5 w-3.5" />
            </a>
          )}
          {professional.phone && (
            <a
              href={`tel:${professional.phone.replace(/[^\d+]/g, "")}`}
              onClick={(event) => event.stopPropagation()}
              className="group/action relative h-8 w-8 flex items-center justify-center rounded-lg border border-emerald-200 text-emerald-700 hover:bg-emerald-50 transition-colors"
              aria-label={`Call ${name}`}
            >
              <ActionTooltip label="Call" />
              <Phone className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </div>

      <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
        <DialogContent className="sm:max-w-md" onClick={(event) => event.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Message {professional.businessName ?? name}</DialogTitle>
            <DialogDescription>
              What do you need help with? This opens a private request for this professional only.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={messageIssue}
            onChange={(event) => {
              setMessageIssue(event.target.value);
              setMessageError("");
            }}
            placeholder="e.g. I need help with a leaking sink this week."
            className="min-h-28"
          />
          {messageError && <p className="text-sm text-red-600">{messageError}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setMessageDialogOpen(false)} disabled={messageLoading}>
              Cancel
            </Button>
            <Button type="button" onClick={startDirectMessage} disabled={messageLoading} className="bg-emerald-600 text-white hover:bg-emerald-700">
              {messageLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Start chat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
