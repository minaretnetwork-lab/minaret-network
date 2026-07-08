import Link from "next/link";
import { getMyServiceRequests } from "@/lib/actions/service-requests";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { Clock, MapPin } from "lucide-react";

export const metadata = { title: "My Requests" };

const STATUS_STYLES: Record<string, string> = {
  OPEN: "bg-green-100 text-green-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  CLOSED: "bg-gray-100 text-gray-600",
  CANCELLED: "bg-red-100 text-red-700",
};

export default async function MyRequestsPage() {
  const requests = await getMyServiceRequests();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Requests</h1>
        <Link href="/request">
          <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">New Request</Button>
        </Link>
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl">
          <div className="text-4xl mb-4">📋</div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">No requests yet</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Submit a request when you need a professional service.
          </p>
          <Link href="/request">
            <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">Submit a Request</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <div key={req.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{req.category.icon ?? "📋"}</span>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{req.category.name}</h3>
                    {req.serviceArea && (
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3" /> {req.serviceArea.name}
                      </p>
                    )}
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 leading-relaxed">{req.description}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_STYLES[req.status] ?? "bg-gray-100 text-gray-600"}`}>
                    {req.status.replace("_", " ")}
                  </span>
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {formatDate(req.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
