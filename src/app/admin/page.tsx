export const dynamic = "force-dynamic";

import { getAdminAnalytics, getAdminStats } from "@/lib/actions/admin";
import { DEFAULT_MOSQUE_SLUG } from "@/lib/constants";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Clock, CheckCircle, MessageSquare, FileText, TrendingUp } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AnalyticsDashboard } from "@/components/admin/analytics-dashboard";

export const metadata = { title: "Admin Dashboard" };

export default async function AdminDashboardPage() {
  const [stats, analytics] = await Promise.all([
    getAdminStats(DEFAULT_MOSQUE_SLUG),
    getAdminAnalytics(),
  ]);

  const tiles = [
    { label: "Approved Professionals", value: stats?.approvedProfessionals ?? 0, icon: <CheckCircle className="h-5 w-5 text-green-600" />, href: "/admin/professionals?status=APPROVED", color: "bg-green-50 dark:bg-green-900/20" },
    { label: "Pending Approvals", value: stats?.pendingProfessionalReviews ?? stats?.pendingProfessionals ?? 0, icon: <Clock className="h-5 w-5 text-amber-600" />, href: "/admin/professionals?status=PENDING", color: "bg-amber-50 dark:bg-amber-900/20" },
    { label: "Total Members", value: stats?.totalMembers ?? 0, icon: <Users className="h-5 w-5 text-blue-600" />, href: "/admin/users", color: "bg-blue-50 dark:bg-blue-900/20" },
    { label: "Open Requests", value: stats?.openRequests ?? 0, icon: <FileText className="h-5 w-5 text-purple-600" />, href: "/admin/requests", color: "bg-purple-50 dark:bg-purple-900/20" },
    { label: "Pending Reviews", value: stats?.pendingRecommendations ?? 0, icon: <MessageSquare className="h-5 w-5 text-rose-600" />, href: "/admin/recommendations", color: "bg-rose-50 dark:bg-rose-900/20" },
    { label: "Total Professionals", value: stats?.totalProfessionals ?? 0, icon: <TrendingUp className="h-5 w-5 text-gray-600" />, href: "/admin/professionals", color: "bg-gray-50 dark:bg-gray-800/50" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Overview of the Minaret Network professionals</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tiles.map((tile) => (
          <Link key={tile.label} href={tile.href}>
            <Card className="hover:shadow-md transition-shadow border-gray-200 dark:border-gray-800 cursor-pointer">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{tile.label}</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{tile.value}</p>
                  </div>
                  <div className={`h-12 w-12 rounded-xl ${tile.color} flex items-center justify-center`}>
                    {tile.icon}
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {((stats?.pendingProfessionalReviews ?? stats?.pendingProfessionals) ?? 0) > 0 && (
        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/10">
          <CardContent className="p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-amber-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-amber-900 dark:text-amber-300">
                  {stats!.pendingProfessionalReviews ?? stats!.pendingProfessionals} professional review{(stats!.pendingProfessionalReviews ?? stats!.pendingProfessionals) !== 1 ? "s" : ""} awaiting approval
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  Review and approve or reject pending professional applications
                </p>
              </div>
            </div>
            <Link href="/admin/professionals?status=PENDING">
              <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white flex-shrink-0">
                Review Now
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <AnalyticsDashboard data={analytics} />
    </div>
  );
}
