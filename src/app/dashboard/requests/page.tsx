import Link from "next/link";
import { getMyServiceRequests } from "@/lib/actions/service-requests";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { Clock, MapPin, Phone, Mail, MessageCircle, UserCheck, Plus, ClipboardList, ChevronRight } from "lucide-react";
import { CategoryIcon } from "@/components/ui/category-icon";
import { RequestArchiveButton, RequestArchiveContextCard } from "@/components/dashboard/request-archive-button";

export const metadata = { title: "My Requests" };

const STATUS_STYLES: Record<string, { pill: string; label: string }> = {
  OPEN:        { pill: "bg-green-100 text-green-700 border-green-200",   label: "Open" },
  IN_PROGRESS: { pill: "bg-blue-100 text-blue-700 border-blue-200",     label: "In Progress" },
  CLOSED:      { pill: "bg-gray-100 text-gray-600 border-gray-200",     label: "Closed" },
  CANCELLED:   { pill: "bg-red-100 text-red-700 border-red-200",        label: "Cancelled" },
};

const CONTACT_ICON: Record<string, React.ReactNode> = {
  EMAIL:    <Mail className="h-3 w-3" />,
  PHONE:    <Phone className="h-3 w-3" />,
  WHATSAPP: <MessageCircle className="h-3 w-3" />,
};

type StatusFilter = "all" | "open" | "closed" | "archived";

interface MyRequestsPageProps {
  searchParams?: Promise<{ status?: string }>;
}

export default async function MyRequestsPage({ searchParams }: MyRequestsPageProps) {
  const params = await searchParams;
  const statusFilter: StatusFilter =
    params?.status === "open" || params?.status === "closed" || params?.status === "archived" ? params.status : "all";
  const requests = await getMyServiceRequests({ includeArchived: true });

  const open = requests.filter((r) => !["CLOSED", "CANCELLED"].includes(r.status) && !r.requesterArchivedAt).length;
  const closed = requests.filter((r) => ["CLOSED", "CANCELLED"].includes(r.status) && !r.requesterArchivedAt).length;
  const archived = requests.filter((r) => Boolean(r.requesterArchivedAt)).length;
  const sortedRequests = [...requests].sort((a, b) => {
    const aArchived = Boolean(a.requesterArchivedAt);
    const bArchived = Boolean(b.requesterArchivedAt);
    const aClosed = ["CLOSED", "CANCELLED"].includes(a.status);
    const bClosed = ["CLOSED", "CANCELLED"].includes(b.status);
    if (aArchived !== bArchived) return aArchived ? 1 : -1;
    if (aClosed !== bClosed) return aClosed ? 1 : -1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  const filteredRequests = sortedRequests.filter((request) => {
    if (statusFilter === "archived") return Boolean(request.requesterArchivedAt);
    if (statusFilter === "open") return !["CLOSED", "CANCELLED"].includes(request.status) && !request.requesterArchivedAt;
    if (statusFilter === "closed") return ["CLOSED", "CANCELLED"].includes(request.status) && !request.requesterArchivedAt;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Requests</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Service requests you have submitted
          </p>
        </div>
        <Link href="/request">
          <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white gap-1.5">
            <Plus className="h-4 w-4" /> New Request
          </Button>
        </Link>
      </div>

      {/* Stats strip */}
      {requests.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatBox label="Open" value={open} color="text-green-600" href="/dashboard/requests?status=open" active={statusFilter === "open"} />
          <StatBox label="Closed / Cancelled" value={closed} color="text-gray-500" href="/dashboard/requests?status=closed" active={statusFilter === "closed"} />
          <StatBox label="Archived" value={archived} color="text-slate-500" href="/dashboard/requests?status=archived" active={statusFilter === "archived"} />
        </div>
      )}

      {requests.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl">
          <div className="mb-4 flex justify-center"><ClipboardList className="h-12 w-12 text-gray-300" /></div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">No requests yet</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Need a plumber, realtor, or handyman? Submit a request and get matched.
          </p>
          <Link href="/request">
            <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">Submit a Request</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {statusFilter !== "all" && (
            <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm dark:border-gray-800 dark:bg-gray-900">
              <span className="text-gray-600 dark:text-gray-400">
                Showing {statusFilter === "open" ? "open" : statusFilter === "closed" ? "closed/cancelled" : "archived"} requests
              </span>
              <Link href="/dashboard/requests" className="font-medium text-emerald-700 hover:underline">
                Clear filter
              </Link>
            </div>
          )}

          {filteredRequests.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-400 dark:border-gray-800 dark:bg-gray-900">
              No {statusFilter === "open" ? "open" : statusFilter === "closed" ? "closed/cancelled" : "archived"} requests found.
            </div>
          ) : filteredRequests.map((req) => {
            const ui = STATUS_STYLES[req.status] ?? STATUS_STYLES.OPEN;
            const assignedName = req.assignedTo
              ? (req.assignedTo.user.displayName ??
                 [req.assignedTo.user.firstName, req.assignedTo.user.lastName].filter(Boolean).join(" "))
              : null;

            const canArchive = ["CLOSED", "CANCELLED"].includes(req.status);
            const isArchived = Boolean(req.requesterArchivedAt);

            return (
              <RequestArchiveContextCard key={req.id} requestId={req.id} archived={isArchived} enabled={canArchive || isArchived}>
              <div className="group rounded-xl border border-gray-200 bg-white p-5 transition-all hover:border-emerald-300 hover:shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <Link href={`/dashboard/requests/${req.id}`} className="block cursor-pointer">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500"><CategoryIcon slug={req.category.slug} className="h-5 w-5" /></div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{req.category.name}</h3>
                        {req.serviceArea && (
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {req.serviceArea.name}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1.5 leading-relaxed">
                        {req.description}
                      </p>

                      {/* Meta row */}
                      <div className="flex flex-wrap items-center gap-3 mt-2.5 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {formatDate(req.createdAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          {CONTACT_ICON[req.preferredContact]}
                          Preferred: {req.preferredContact.charAt(0) + req.preferredContact.slice(1).toLowerCase().replace("_", " ")}
                        </span>
                        {req.preferredDate && (
                          <span>Preferred date: {new Date(req.preferredDate).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" })}</span>
                        )}
                      </div>

                      {/* Assigned professional */}
                      {assignedName && (
                        <div className="mt-2.5 flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/40 rounded-lg px-2.5 py-1.5 w-fit">
                          <UserCheck className="h-3.5 w-3.5 flex-shrink-0" />
                          Assigned to{" "}
                          <Link href={`/professionals/${req.assignedTo!.id}`} className="font-semibold hover:underline">
                            {assignedName}
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>

                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium border flex-shrink-0 ${ui.pill}`}>
                    {ui.label}
                  </span>
                </div>
                </Link>
                <div className="mt-3 flex items-center justify-between gap-3 border-t border-gray-100 pt-3 dark:border-gray-800">
                  <div>
                    {(canArchive || isArchived) && (
                      <RequestArchiveButton requestId={req.id} archived={isArchived} />
                    )}
                  </div>
                  <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-1 group-hover:gap-2 transition-all">
                    View details <ChevronRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
              </RequestArchiveContextCard>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatBox({ label, value, color, href, active }: { label: string; value: number; color: string; href: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`block rounded-xl border bg-white p-4 text-center transition hover:border-emerald-300 hover:shadow-sm dark:bg-gray-900 ${
        active ? "border-emerald-300 ring-2 ring-emerald-100 dark:border-emerald-700 dark:ring-emerald-900/30" : "border-gray-200 dark:border-gray-800"
      }`}
    >
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{label}</p>
    </Link>
  );
}
