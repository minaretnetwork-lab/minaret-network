import { getAllServiceRequests } from "@/lib/actions/service-requests";
import { DEFAULT_MOSQUE_SLUG } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { MapPin, Clock } from "lucide-react";

export const metadata = { title: "Service Requests" };

const STATUS_BADGE: Record<string, string> = {
  OPEN: "bg-green-100 text-green-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  CLOSED: "bg-gray-100 text-gray-600",
  CANCELLED: "bg-red-100 text-red-700",
};

export default async function AdminRequestsPage() {
  const requests = await getAllServiceRequests(DEFAULT_MOSQUE_SLUG);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Service Requests</h1>

      {requests.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl">
          <p className="text-gray-400 text-sm">No service requests yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => {
            const memberName = req.user.displayName ??
              [req.user.firstName, req.user.lastName].filter(Boolean).join(" ") ?? req.user.email;

            return (
              <div key={req.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{req.category.icon ?? "📋"}</span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{req.category.name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[req.status] ?? ""}`}>
                          {req.status.replace("_", " ")}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        By {memberName} · {req.user.email}
                      </p>
                      {req.serviceArea && (
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3" /> {req.serviceArea.name}
                        </p>
                      )}
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 leading-relaxed">{req.description}</p>
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-1.5">
                        <Clock className="h-3 w-3" /> {formatDate(req.createdAt)} · Contact: {req.preferredContact.toLowerCase()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
