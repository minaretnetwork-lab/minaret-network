import Link from "next/link";
import { getCurrentUser } from "@/lib/actions/auth";
import { getMyServiceRequests } from "@/lib/actions/service-requests";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, User, Search, ChevronRight, Clock } from "lucide-react";
import { CategoryIcon } from "@/components/ui/category-icon";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const [user, requests] = await Promise.all([
    getCurrentUser(),
    getMyServiceRequests(),
  ]);

  if (!user) return null;

  const displayName = user.displayName ?? user.firstName ?? "there";
  const recentRequests = requests.slice(0, 3);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Welcome, {displayName}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Here's what's happening with your account.
        </p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/professionals">
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-gray-200 dark:border-gray-800">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600">
                <Search className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-sm text-gray-900 dark:text-white">Find Professionals</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Browse the directory</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/request">
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-gray-200 dark:border-gray-800">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-sm text-gray-900 dark:text-white">Request Help</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Submit a service request</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        {!user.professional ? (
          <Link href="/professionals/register">
            <Card className="hover:shadow-md transition-shadow cursor-pointer border-gray-200 dark:border-gray-800">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-sm text-gray-900 dark:text-white">Join as Professional</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Create your listing</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ) : (
          <Link href="/dashboard/professional">
            <Card className="hover:shadow-md transition-shadow cursor-pointer border-gray-200 dark:border-gray-800">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-sm text-gray-900 dark:text-white">My Listing</p>
                  <p className="text-xs text-gray-500 capitalize dark:text-gray-400">
                    {user.professional.status.toLowerCase()}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        )}
      </div>

      {/* Recent requests */}
      <Card className="border-gray-200 dark:border-gray-800">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">Recent Requests</CardTitle>
            <Link href="/dashboard/requests">
              <Button variant="ghost" size="sm" className="text-xs text-green-700 gap-1">
                View all <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {recentRequests.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-gray-400">No requests yet.</p>
              <Link href="/request" className="mt-3 inline-block">
                <Button size="sm" variant="outline" className="border-green-300 text-green-700 hover:bg-green-50">
                  Submit a Request
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentRequests.map((req) => (
                <div key={req.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500"><CategoryIcon slug={req.category.slug} className="h-4 w-4" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{req.category.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{req.description}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      req.status === "OPEN" ? "bg-green-100 text-green-700" :
                      req.status === "IN_PROGRESS" ? "bg-blue-100 text-blue-700" :
                      "bg-gray-100 text-gray-600"
                    }`}>
                      {req.status.replace("_", " ")}
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDate(req.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
