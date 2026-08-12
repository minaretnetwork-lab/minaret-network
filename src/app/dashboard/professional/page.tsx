import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/actions/auth";
import { CategoryIcon } from "@/components/ui/category-icon";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { VerificationBadges } from "@/components/professionals/verification-badges";
import { DeleteProfessionalListingButton } from "@/components/dashboard/delete-professional-listing-button";
import { formatDate } from "@/lib/utils";
import { Eye, Star, Clock, CheckCircle, XCircle, AlertCircle, Sparkles, ArrowRight, User, Plus, Megaphone } from "lucide-react";
import type { BadgeType } from "@/types";
import { withdrawProfessionalApplication } from "@/lib/actions/professionals";

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

export default async function ProfessionalDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const professionals = await prisma.professional.findMany({
    where: { userId: user.id },
    include: {
      category: true,
      serviceAreas: true,
      badges: true,
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
        return (
          <section key={professional.id} className="space-y-6 rounded-2xl border border-gray-200 bg-white/40 p-4 dark:border-gray-800 dark:bg-gray-900/30">
      {/* Status banner */}
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

      {/* Stats */}
      {professional.status === "APPROVED" && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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

      {/* Badges */}
      {professional.badges.length > 0 && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Your Verification Badges</h3>
          <VerificationBadges badges={professional.badges as { id: string; type: BadgeType }[]} />
        </div>
      )}

      {/* Sponsored listing history */}
      <SponsoredHistory listings={professional.sponsoredListings as SponsoredListing[]} />

      {/* Profile summary */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 space-y-3">
        <h3 className="font-semibold text-gray-900 dark:text-white">Profile Summary</h3>
        <dl className="space-y-2 text-sm">
          <div className="flex gap-3">
            <dt className="text-gray-500 dark:text-gray-400 w-32 flex-shrink-0">Category</dt>
            <dd className="text-gray-900 dark:text-white flex items-center gap-1.5"><CategoryIcon slug={professional.category.slug} className="h-4 w-4 text-gray-500" />{professional.category.name}</dd>
          </div>
          {professional.businessName && (
            <div className="flex gap-3">
              <dt className="text-gray-500 dark:text-gray-400 w-32 flex-shrink-0">Business</dt>
              <dd className="text-gray-900 dark:text-white">{professional.businessName}</dd>
            </div>
          )}
          {professional.yearsOfExperience && (
            <div className="flex gap-3">
              <dt className="text-gray-500 dark:text-gray-400 w-32 flex-shrink-0">Experience</dt>
              <dd className="text-gray-900 dark:text-white">{professional.yearsOfExperience}+ years</dd>
            </div>
          )}
          <div className="flex gap-3">
            <dt className="text-gray-500 dark:text-gray-400 w-32 flex-shrink-0">Service Areas</dt>
            <dd className="text-gray-900 dark:text-white">
              {professional.serviceAreas.map((a) => a.name).join(", ") || "—"}
            </dd>
          </div>
          <div className="flex gap-3">
            <dt className="text-gray-500 dark:text-gray-400 w-32 flex-shrink-0">Languages</dt>
            <dd className="text-gray-900 dark:text-white">{professional.languages.join(", ") || "—"}</dd>
          </div>
          <div className="flex gap-3">
            <dt className="text-gray-500 dark:text-gray-400 w-32 flex-shrink-0">Submitted</dt>
            <dd className="text-gray-900 dark:text-white">{formatDate(professional.submittedAt)}</dd>
          </div>
        </dl>
      </div>

      <div className="flex flex-wrap gap-3">
        {professional.status === "PENDING" && (
          <form action={withdrawProfessionalApplication.bind(null, professional.id)}>
            <Button
              type="submit"
              variant="outline"
              size="sm"
              className="border-blue-300 text-blue-700 hover:bg-blue-50"
            >
              Call back for edits
            </Button>
          </form>
        )}
        {professional.status !== "PENDING" && (
          <Link href={`/professionals/${professional.id}/edit`}>
            <Button variant="outline" size="sm" className="border-green-300 text-green-700 hover:bg-green-50">
              {professional.status === "WITHDRAWN" ? "Edit & resubmit" : "Edit Listing"}
            </Button>
          </Link>
        )}
        {professional.isFeatured && professional.editDrafts.length === 0 && (
          <p className="flex items-center rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Featured profile edits go to admin review while your current public profile stays live.
          </p>
        )}
        {professional.editDrafts.length > 0 && (
          <p className="flex items-center rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
            You have edits waiting for admin review. Your current public profile remains live.
          </p>
        )}
        <DeleteProfessionalListingButton
          professionalId={professional.id}
          status={professional.status}
          label={professional.businessName ?? professional.category.name}
        />
      </div>
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
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-violet-600" />
          Sponsored Listing History
        </h3>
      </div>

      {listings.length === 0 ? (
        <div className="rounded-xl border border-dashed border-violet-200 bg-violet-50/40 px-4 py-7 text-center dark:border-violet-900/40 dark:bg-violet-950/10">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-white text-violet-700 shadow-sm dark:bg-gray-900 dark:text-violet-300">
            <Megaphone className="h-5 w-5" />
          </div>
          <p className="hidden text-2xl font-bold text-gray-200 dark:text-gray-700 mb-1">0</p>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">No sponsored listings yet</p>
          <p className="mx-auto mt-1 max-w-sm text-xs text-gray-500 dark:text-gray-400">
            Sponsored placements are coming soon. Admins can still manage sponsored status directly.
          </p>
        </div>
      ) : (
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
      )}
    </div>
  );
}
