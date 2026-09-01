import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/actions/auth";
import { CategoryIcon } from "@/components/ui/category-icon";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { VerificationBadges } from "@/components/professionals/verification-badges";
import { DeleteProfessionalListingButton } from "@/components/dashboard/delete-professional-listing-button";
import { formatDate } from "@/lib/utils";
import { Eye, Star, Clock, CheckCircle, XCircle, AlertCircle, Sparkles, User, Plus, Megaphone, Pencil, MapPin, Languages, Calendar, Zap } from "lucide-react";
import type { BadgeType } from "@/types";
import { withdrawProfessionalApplication } from "@/lib/actions/professionals";
import { AffiliationVisibilityToggle } from "@/components/dashboard/affiliation-visibility-toggle";

export const metadata = { title: "My Professional Listings" };

const STATUS_UI: Record<string, { label: string; color: string; icon: React.ReactNode; desc: string }> = {
  PENDING: {
    label: "Pending Review",
    color: "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-900/10 dark:border-amber-800 dark:text-amber-300",
    icon: <Clock className="h-5 w-5 text-amber-600" />,
    desc: "Your application is being reviewed by the Minaret Network administration.",
  },
  WITHDRAWN: {
    label: "Called Back for Edits",
    color: "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/10 dark:border-blue-800 dark:text-blue-300",
    icon: <AlertCircle className="h-5 w-5 text-blue-600" />,
    desc: "This application is hidden from admin review while you make edits. Submit it again when you are ready.",
  },
  APPROVED: {
    label: "Approved & Live",
    color: "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/10 dark:border-green-800 dark:text-green-300",
    icon: <CheckCircle className="h-5 w-5 text-green-600" />,
    desc: "Your profile is live and visible to mosque members.",
  },
  REJECTED: {
    label: "Application Rejected",
    color: "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/10 dark:border-red-800 dark:text-red-300",
    icon: <XCircle className="h-5 w-5 text-red-600" />,
    desc: "Your application was not approved. Please review the reason and resubmit.",
  },
  SUSPENDED: {
    label: "Listing Suspended",
    color: "bg-gray-50 border-gray-200 text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300",
    icon: <AlertCircle className="h-5 w-5 text-gray-500" />,
    desc: "Your listing has been temporarily suspended. Please contact the administration.",
  },
};

export default async function ProfessionalDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ claimed?: string; name?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");
  const { claimed, name } = await searchParams;

  const professionals = await prisma.professional.findMany({
    where: { userId: user.id },
    include: {
      category: true,
      serviceAreas: true,
      badges: true,
      mosque: { select: { name: true } },
      recommendations: { where: { status: "APPROVED" } },
      galleryImages: true,
      credentials: true,
      editDrafts: {
        where: { status: "PENDING" },
        orderBy: { submittedAt: "desc" },
        take: 1,
      },
      sponsoredListings: {
        include: {
          category: { select: { name: true, slug: true, icon: true } },
          serviceArea: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  if (professionals.length === 0) {
    return (
      <div className="text-center py-16 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl">
        <div className="mb-4 flex justify-center"><User className="h-12 w-12 text-gray-300" /></div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          You&apos;re not registered as a professional
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Join Minaret Network as a professional to be discoverable by mosque members across the GTA.
        </p>
        <Link href="/professionals/register">
          <Button className="bg-green-600 hover:bg-green-700 text-white">
            Register as Professional
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {claimed === "1" && (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 px-5 py-4">
          <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-emerald-900 dark:text-emerald-200">
              {name ? `"${name}" claimed successfully!` : "Listing claimed successfully!"}
            </p>
            <p className="text-sm text-emerald-700 dark:text-emerald-400 mt-0.5">
              You can now edit your profile details below.
            </p>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Professional Listings</h1>
        <Link href="/professionals/register">
          <Button size="sm" className="gap-1.5 bg-green-600 hover:bg-green-700 text-white">
            <Plus className="h-4 w-4" /> Add Another Listing
          </Button>
        </Link>
      </div>

      {professionals.map((professional) => {
        const statusInfo = STATUS_UI[professional.status] ?? STATUS_UI.PENDING;
        const canEdit = professional.status !== "PENDING";
        const displayName = professional.businessName || professional.title || professional.category.name;
        return (
          <section key={professional.id} className="space-y-4 rounded-2xl border border-gray-200 bg-white/40 p-4 dark:border-gray-800 dark:bg-gray-900/30">

            {/* ── 1. Profile card ── */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
              {/* header row */}
              <div className="flex items-start gap-4 p-5">
                <div className="h-14 w-14 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 flex items-center justify-center flex-shrink-0">
                  <CategoryIcon slug={professional.category.slug} className="h-7 w-7 text-emerald-700 dark:text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 dark:text-white text-lg leading-snug">{displayName}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{professional.category.name}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {professional.status === "APPROVED" && (
                        <Link href={`/professionals/${professional.id}`}>
                          <Button variant="outline" size="sm" className="gap-1.5 border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950/30">
                            <Eye className="h-4 w-4" />
                            View Profile
                          </Button>
                        </Link>
                      )}
                      {canEdit && (
                        <Link href={`/professionals/${professional.id}/edit`}>
                          <Button size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white">
                            <Pencil className="h-4 w-4" />
                            {professional.status === "WITHDRAWN" ? "Edit & Resubmit" : "Edit Profile"}
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
                    {professional.serviceAreas.length > 0 && (
                      <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                        <MapPin className="h-3 w-3" />{professional.serviceAreas.map(a => a.name).join(", ")}
                      </span>
                    )}
                    {professional.languages.length > 0 && (
                      <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                        <Languages className="h-3 w-3" />{professional.languages.join(", ")}
                      </span>
                    )}
                    {professional.yearsOfExperience && (
                      <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                        <Calendar className="h-3 w-3" />{professional.yearsOfExperience}+ yrs experience
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* secondary actions bar */}
              <div className="border-t border-gray-100 dark:border-gray-800 px-5 py-3 flex flex-wrap items-center gap-3 bg-gray-50/50 dark:bg-gray-800/20">
                {professional.status === "PENDING" && (
                  <form action={withdrawProfessionalApplication.bind(null, professional.id)}>
                    <Button type="submit" variant="outline" size="sm" className="border-blue-300 text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-950/30 h-8 text-xs">
                      Call back for edits
                    </Button>
                  </form>
                )}
                {professional.isFeatured && professional.editDrafts.length === 0 && (
                  <p className="text-xs text-amber-700 dark:text-amber-400">Featured edits go to admin review — your live profile stays active.</p>
                )}
                {professional.editDrafts.length > 0 && (
                  <p className="text-xs text-blue-700 dark:text-blue-400">Edits pending review — your current public profile remains live.</p>
                )}
                <div className="ml-auto">
                  <DeleteProfessionalListingButton
                    professionalId={professional.id}
                    status={professional.status}
                    label={professional.businessName ?? professional.category.name}
                  />
                </div>
              </div>
            </div>

            {/* ── 2. Status banner ── */}
            <div className={`flex items-start gap-3 p-4 rounded-xl border ${statusInfo.color}`}>
              {statusInfo.icon}
              <div>
                <p className="font-semibold">{statusInfo.label}</p>
                <p className="text-sm mt-0.5 opacity-80">{statusInfo.desc}</p>
                {professional.rejectionReason && (
                  <p className="text-sm mt-2 font-medium">Reason: {professional.rejectionReason}</p>
                )}
              </div>
            </div>

            {/* ── 3. Stats ── */}
            {professional.status === "APPROVED" && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{professional.profileViews}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center justify-center gap-1">
                    <Eye className="h-3 w-3" /> Profile Views
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{professional.recommendations.length}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center justify-center gap-1">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> Recommendations
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{professional.galleryImages.length}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Gallery Photos</p>
                </div>
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 text-center">
                  <p className={`text-2xl font-bold ${professional.sponsoredListings.length > 0 ? "text-violet-600" : "text-gray-400 dark:text-gray-600"}`}>
                    {professional.sponsoredListings.length}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center justify-center gap-1">
                    <Sparkles className="h-3 w-3" /> Sponsored Runs
                  </p>
                </div>
              </div>
            )}

            {/* ── 4. Badges ── */}
            {professional.badges.length > 0 && (
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Your Verification Badges</h3>
                <VerificationBadges badges={professional.badges as { id: string; type: BadgeType }[]} />
                {professional.badges.some((b) => b.type === "MOSQUE_AFFILIATED") && professional.mosque && (
                  <div className="mt-3">
                    <AffiliationVisibilityToggle
                      professionalId={professional.id}
                      initialVisible={professional.mosqueAffiliationVisible}
                      mosqueName={professional.mosque.name}
                    />
                  </div>
                )}
              </div>
            )}

            {/* ── 5. Sponsored ── */}
            <SponsoredHistory listings={professional.sponsoredListings as SponsoredListing[]} />

          </section>
        );
      })}
    </div>
  );
}

// ── Sponsored history ──────────────────────────────────────────────────────────

type SponsoredListing = {
  id: string;
  status: string;
  priceMonthly: number | { toNumber: () => number };
  startDate: Date | null;
  cancelledAt: Date | null;
  createdAt: Date;
  adminNote: string | null;
  category: { name: string; slug: string; icon: string | null };
  serviceArea: { name: string };
};

const SPONSORED_STATUS: Record<string, { label: string; pill: string }> = {
  PENDING:   { label: "Pending Review", pill: "bg-amber-100 text-amber-700 border-amber-200" },
  ACTIVE:    { label: "Active",         pill: "bg-violet-100 text-violet-700 border-violet-200" },
  REJECTED:  { label: "Rejected",       pill: "bg-red-100 text-red-700 border-red-200" },
  CANCELLED: { label: "Cancelled",      pill: "bg-gray-100 text-gray-500 border-gray-200" },
};

function SponsoredHistory({ listings }: { listings: SponsoredListing[] }) {
  if (listings.length === 0) {
    return (
      <div className="rounded-xl overflow-hidden border border-violet-200 dark:border-violet-900/50">
        {/* gradient header */}
        <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-4 flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-white text-sm">Get Sponsored — Appear First</p>
            <p className="text-violet-200 text-xs mt-0.5">Pin your listing to the top of search results for your category</p>
          </div>
          <span className="ml-auto text-[10px] font-semibold uppercase tracking-wider bg-white/20 text-white px-2.5 py-1 rounded-full flex-shrink-0 whitespace-nowrap">Free now</span>
        </div>
        {/* benefits + CTA */}
        <div className="bg-white dark:bg-gray-900 px-5 py-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { icon: <Eye className="h-4 w-4 text-violet-600" />, title: "Priority placement", desc: "Appear above all standard results" },
              { icon: <Star className="h-4 w-4 text-violet-600" />, title: "Sponsored badge", desc: "Visible trust signal on your card" },
              { icon: <Megaphone className="h-4 w-4 text-violet-600" />, title: "More inquiries", desc: "Sponsored pros attract more contact requests" },
            ].map((b) => (
              <div key={b.title} className="flex gap-2.5 items-start">
                <div className="mt-0.5 flex-shrink-0 h-7 w-7 rounded-lg bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center">{b.icon}</div>
                <div>
                  <p className="text-xs font-semibold text-gray-900 dark:text-white">{b.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between gap-4 pt-3 border-t border-gray-100 dark:border-gray-800">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              <span className="font-semibold text-emerald-700 dark:text-emerald-400">FREE</span>
            </p>
            <Link href="/dashboard/promote" className="flex-shrink-0">
              <Button size="sm" className="bg-violet-600 hover:bg-violet-700 text-white gap-1.5 h-8 text-xs">
                <Sparkles className="h-3.5 w-3.5" /> Apply Now
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
      <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
        <Sparkles className="h-4 w-4 text-violet-600" />
        Sponsored Listing History
      </h3>
      <div className="space-y-3">
        {listings.map((l) => {
          const ui = SPONSORED_STATUS[l.status] ?? SPONSORED_STATUS.CANCELLED;
          const price = typeof l.priceMonthly === "object" ? l.priceMonthly.toNumber() : Number(l.priceMonthly);
          return (
            <div key={l.id} className="flex items-start justify-between gap-3 py-3 border-b border-gray-100 dark:border-gray-800 last:border-0 last:pb-0 first:pt-0">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  <CategoryIcon slug={l.category.slug} className="inline h-3.5 w-3.5 mr-1 -mt-0.5" />{l.category.name} · {l.serviceArea.name}
                </p>
                <div className="flex flex-wrap gap-2 mt-1 text-xs text-gray-400">
                  <span>${price.toFixed(0)}/mo</span>
                  {l.startDate && <span>· Started {new Date(l.startDate).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" })}</span>}
                  {l.cancelledAt && <span>· Ended {new Date(l.cancelledAt).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" })}</span>}
                  {!l.startDate && <span>· Applied {new Date(l.createdAt).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" })}</span>}
                </div>
                {l.adminNote && l.status === "REJECTED" && (
                  <p className="text-xs text-red-600 mt-1">Reason: {l.adminNote}</p>
                )}
              </div>
              <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium flex-shrink-0 ${ui.pill}`}>
                {ui.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
