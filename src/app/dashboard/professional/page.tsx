import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/actions/auth";
import { CategoryIcon } from "@/components/ui/category-icon";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { VerificationBadges } from "@/components/professionals/verification-badges";
import { formatDate } from "@/lib/utils";
import { Eye, Star, Clock, CheckCircle, XCircle, AlertCircle, Sparkles, ArrowRight, User } from "lucide-react";
import type { BadgeType } from "@/types";

export const metadata = { title: "My Professional Listing" };

const STATUS_UI: Record<string, { label: string; color: string; icon: React.ReactNode; desc: string }> = {
  PENDING: {
    label: "Pending Review",
    color: "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-900/10 dark:border-amber-800 dark:text-amber-300",
    icon: <Clock className="h-5 w-5 text-amber-600" />,
    desc: "Your application is being reviewed by the Minaret Network administration.",
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

  const professional = await prisma.professional.findUnique({
    where: { userId: user.id },
    include: {
      category: true,
      serviceAreas: true,
      badges: true,
      recommendations: { where: { status: "APPROVED" } },
      galleryImages: true,
      credentials: true,
      sponsoredListings: {
        include: {
          category: { select: { name: true, slug: true, icon: true } },
          serviceArea: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!professional) {
    return (
      <div className="text-center py-16 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl">
        <div className="mb-4 flex justify-center"><User className="h-12 w-12 text-gray-300" /></div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          You're not registered as a professional
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

  const statusInfo = STATUS_UI[professional.status] ?? STATUS_UI.PENDING;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Professional Listing</h1>
        {professional.status === "APPROVED" && (
          <Link href={`/professionals/${professional.id}`} target="_blank">
            <Button variant="outline" size="sm" className="gap-1.5 border-green-300 text-green-700">
              <Eye className="h-4 w-4" /> View Public Profile
            </Button>
          </Link>
        )}
      </div>

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

      <div className="flex gap-3">
        <Link href="/professionals/register">
          <Button variant="outline" size="sm" className="border-green-300 text-green-700 hover:bg-green-50">
            Update Profile
          </Button>
        </Link>
      </div>
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
        <Link
          href="/dashboard/promote"
          className="text-xs text-violet-700 dark:text-violet-400 hover:underline flex items-center gap-1"
        >
          Manage <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {listings.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-2xl font-bold text-gray-200 dark:text-gray-700 mb-1">0</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">No sponsored listings yet</p>
          <Link href="/dashboard/promote" className="text-xs text-violet-700 dark:text-violet-400 hover:underline mt-2 inline-block">
            Promote your business →
          </Link>
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
