import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/actions/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { VerificationBadges } from "@/components/professionals/verification-badges";
import { formatDate } from "@/lib/utils";
import { Eye, Star, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
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
    },
  });

  if (!professional) {
    return (
      <div className="text-center py-16 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl">
        <div className="text-4xl mb-4">👤</div>
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
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{professional.profileViews}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Profile Views</p>
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
        </div>
      )}

      {/* Badges */}
      {professional.badges.length > 0 && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Your Verification Badges</h3>
          <VerificationBadges badges={professional.badges as { id: string; type: BadgeType }[]} />
        </div>
      )}

      {/* Profile summary */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 space-y-3">
        <h3 className="font-semibold text-gray-900 dark:text-white">Profile Summary</h3>
        <dl className="space-y-2 text-sm">
          <div className="flex gap-3">
            <dt className="text-gray-500 dark:text-gray-400 w-32 flex-shrink-0">Category</dt>
            <dd className="text-gray-900 dark:text-white">{professional.category.icon} {professional.category.name}</dd>
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
