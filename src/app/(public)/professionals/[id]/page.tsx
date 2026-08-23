export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import {
  MapPin, Clock, Award, MessageCircle,
  ChevronLeft, Calendar, Languages, Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { VerificationBadges } from "@/components/professionals/verification-badges";
import { ProfilePhotoLightbox } from "@/components/professionals/profile-photo-lightbox";
import { ClaimProfileBanner } from "@/components/professionals/claim-profile-banner";
import { CategoryIcon } from "@/components/ui/category-icon";
import { RecommendationForm } from "@/components/professionals/recommendation-form";
import { ReportRecommendationButton } from "@/components/professionals/report-recommendation-button";
import { PendingChatRedirect } from "@/components/professionals/pending-chat-redirect";
import { ContactLinks } from "@/components/professionals/contact-links";
import { getProfessionalById, incrementProfileView } from "@/lib/actions/professionals";
import { getCurrentUser } from "@/lib/actions/auth";
import { getExistingConversationWithProfessional } from "@/lib/actions/messages";
import { getProfessionalDisplayPhotoUrl } from "@/lib/public-asset-url";
import { getInitials, buildWhatsAppUrl, formatDate } from "@/lib/utils";
import type { BadgeType } from "@/types";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const professional = await getProfessionalById(id);
  if (!professional) return { title: "Professional Not Found" };
  const name = professional.businessName ?? professional.user?.displayName ?? ([professional.user?.firstName, professional.user?.lastName].filter(Boolean).join(" ") || "Business");
  const display = professional.businessName ? `${name} — ${professional.businessName}` : name;
  return { title: display };
}

function getWebsiteLabel(website: string) {
  try {
    const url = new URL(website);
    return url.hostname.replace(/^www\./i, "");
  } catch {
    return website.replace(/^https?:\/\//i, "").replace(/^www\./i, "").replace(/\/.*$/, "");
  }
}

export default async function ProfessionalProfilePage({ params }: Props) {
  const { id } = await params;
  const [professional, currentUser, existingConversation] = await Promise.all([
    getProfessionalById(id),
    getCurrentUser().catch(() => null),
    getExistingConversationWithProfessional(id).catch(() => null),
  ]);

  if (!professional || professional.status !== "APPROVED") {
    notFound();
  }

  // Increment view count (fire and forget)
  incrementProfileView(id).catch(() => {});

  const user = professional.user;
  const name =
    professional.businessName ??
    (user
      ? (user.displayName ?? [user.firstName, user.lastName].filter(Boolean).join(" ") ?? user.email)
      : null) ??
    professional.title ??
    "Business";
  const photoUrl = getProfessionalDisplayPhotoUrl({
    photoUrl: professional.photoUrl,
    avatarUrl: user?.avatarUrl ?? null,
  });
  const isUnclaimed = !!(professional as { isAdminCreated?: boolean }).isAdminCreated &&
    !(professional as { claimedByUserId?: string | null }).claimedByUserId;
  const currentUserName = currentUser
    ? (currentUser.displayName ?? [currentUser.firstName, currentUser.lastName].filter(Boolean).join(" ") ?? null)
    : null;
  const mapsUrl = professional.businessAddress
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(professional.businessAddress)}`
    : null;
  const websiteLabel = professional.website ? getWebsiteLabel(professional.website) : null;

  const approvedRecommendations = professional.recommendations.filter(
    (r) => r.status === "APPROVED"
  );

  return (
    <div className="container mx-auto px-4 py-10 max-w-5xl">
      {currentUser && <PendingChatRedirect professionalId={professional.id} />}

      {/* Claim banner for admin-seeded unclaimed profiles */}
      {isUnclaimed && (
        <ClaimProfileBanner
          professionalId={professional.id}
          isLoggedIn={!!currentUser}
          currentUserEmail={currentUser?.email ?? null}
          currentUserName={currentUserName}
        />
      )}

      {/* Back */}
      <Link
        href="/professionals"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-green-700 mb-6 transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Professionals
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar */}
        <aside className="lg:col-span-1 space-y-5">
          {/* Profile card */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden">
            <ProfilePhotoLightbox
              photoUrl={photoUrl}
              name={name}
              initials={getInitials(name)}
            />
            <div className="p-6 text-center">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{name}</h1>
            {professional.businessName && (
              <p className="text-sm text-gray-500 dark:text-gray-400">{professional.businessName}</p>
            )}
            <p className="text-green-700 dark:text-green-400 font-medium text-sm mt-1">
              <CategoryIcon slug={professional.category.slug} icon={professional.category.icon} className="inline h-4 w-4 mr-1 -mt-0.5" />{professional.category.name}
            </p>

            {professional.badges.length > 0 && (
              <div className="mt-4">
                <VerificationBadges
                  badges={professional.badges as { id: string; type: BadgeType }[]}
                  mosqueName={(professional as typeof professional & { mosque?: { name: string } }).mosque?.name}
                  size="sm"
                />
                {professional.badges.some((b) => b.type === "MOSQUE_AFFILIATED") && (
                  <p className="mt-2 text-[11px] text-gray-400 dark:text-gray-500 leading-snug text-center px-2">
                    Mosque affiliation is self-reported and not verified or endorsed by{" "}
                    {(professional as typeof professional & { mosque?: { name: string } }).mosque?.name ?? "the mosque"}{" "}
                    or Minaret Network.
                  </p>
                )}
              </div>
            )}

            <ContactLinks
              professionalId={professional.id}
              professionalName={name}
              phone={professional.phone}
              email={professional.email}
              website={professional.website}
              websiteLabel={websiteLabel}
              whatsapp={professional.whatsapp}
              whatsappHref={professional.whatsapp ? buildWhatsAppUrl(professional.whatsapp, `Hi ${name}, I found your profile on Minaret Network.`) : null}
              isLoggedIn={!!currentUser}
              existingConversationId={existingConversation?.id}
            />

            <p className="mt-4 text-center text-[11px] text-gray-400 dark:text-gray-500">
              <Link href="/before-you-hire" className="underline underline-offset-2 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                Before You Hire →
              </Link>
            </p>
            </div>{/* end p-6 */}
          </div>

          {/* Details */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 space-y-3 shadow-sm">
            {professional.yearsOfExperience && (
              <div className="flex items-start gap-2.5 text-sm">
                <Clock className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Experience</span>
                  <p className="text-gray-500 dark:text-gray-400">{professional.yearsOfExperience}+ years</p>
                </div>
              </div>
            )}
            {professional.serviceAreas.length > 0 && (
              <div className="flex items-start gap-2.5 text-sm">
                <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Service Areas</span>
                  <p className="text-gray-500 dark:text-gray-400">
                    {professional.serviceAreas.map((a) => a.name).join(", ")}
                  </p>
                </div>
              </div>
            )}
            {mapsUrl && (
              <div className="flex items-start gap-2.5 text-sm">
                <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Business Address</span>
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-gray-500 hover:text-green-700 hover:underline dark:text-gray-400"
                  >
                    {professional.businessAddress}
                  </a>
                  {professional.acceptsWalkIns && (
                    <p className="mt-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">Walk-ins welcome</p>
                  )}
                </div>
              </div>
            )}
            {professional.languages.length > 0 && (
              <div className="flex items-start gap-2.5 text-sm">
                <Languages className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Languages</span>
                  <p className="text-gray-500 dark:text-gray-400">{professional.languages.join(", ")}</p>
                </div>
              </div>
            )}
            {professional.availability && (
              <div className="flex items-start gap-2.5 text-sm">
                <Calendar className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Availability</span>
                  <p className="text-gray-500 dark:text-gray-400">{professional.availability}</p>
                </div>
              </div>
            )}
            {professional.approvedAt && (
              <div className="flex items-start gap-2.5 text-sm">
                <Award className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Member Since</span>
                  <p className="text-gray-500 dark:text-gray-400">{formatDate(professional.approvedAt)}</p>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Bio */}
          {professional.bio && (
            <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-3">About</h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line">
                {professional.bio}
              </p>
            </section>
          )}

          {/* Qualifications */}
          {(professional.qualifications || professional.licenses) && (
            <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-3">Qualifications & Credentials</h2>
              {professional.qualifications && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Qualifications</p>
                  <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-line">{professional.qualifications}</p>
                </div>
              )}
              {professional.licenses && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Licenses</p>
                  <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-line">{professional.licenses}</p>
                </div>
              )}
            </section>
          )}

          {/* Gallery */}
          {professional.galleryImages.length > 0 && (
            <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-3">Gallery</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {professional.galleryImages.map((img) => (
                  <div key={img.id} className="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                    <img
                      src={img.url}
                      alt={img.caption ?? "Gallery image"}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Recommendations */}
          <section id="recommendations" className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                Community Recommendations ({approvedRecommendations.length})
              </h2>
            </div>

            {approvedRecommendations.length > 0 ? (
              <div className="space-y-4 mb-6">
                {approvedRecommendations.map((rec) => {
                  const recUser = rec.user as { firstName?: string | null; lastName?: string | null; displayName?: string | null };
                  const recName = recUser.displayName ?? [recUser.firstName, recUser.lastName].filter(Boolean).join(" ") ?? "Community Member";
                  return (
                    <div key={rec.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0 pb-4 last:pb-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <div className="h-7 w-7 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-xs font-semibold text-green-700 flex-shrink-0">
                          {getInitials(recName)}
                        </div>
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{recName}</span>
                        {rec.rating && (
                          <div className="flex items-center gap-0.5">
                            {[1,2,3,4,5].map((s) => (
                              <Star key={s} className={`h-3.5 w-3.5 ${s <= rec.rating ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200 dark:fill-gray-700 dark:text-gray-700"}`} />
                            ))}
                          </div>
                        )}
                        {(rec as typeof rec & { highlyRecommended?: boolean }).highlyRecommended && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                            <Star className="h-2.5 w-2.5 fill-current mr-0.5" /> Highly Recommended
                          </span>
                        )}
                        {rec.approvedAt && (
                          <span className="text-xs text-gray-400 ml-auto">{formatDate(rec.approvedAt)}</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{rec.content}</p>
                      <ReportRecommendationButton
                        recommendationId={rec.id}
                        isLoggedIn={!!currentUser}
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-400 mb-5">No recommendations yet. Be the first!</p>
            )}

            <Separator className="mb-5" />
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Submit a Recommendation
            </h3>
            <RecommendationForm professionalId={professional.id} isLoggedIn={!!currentUser} />
          </section>
        </div>
      </div>
    </div>
  );
}
