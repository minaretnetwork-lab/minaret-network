import Link from "next/link";
import { getMyServiceRequests } from "@/lib/actions/service-requests";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { Clock, MapPin, Phone, Mail, MessageCircle, UserCheck, Plus, ClipboardList } from "lucide-react";
import { CategoryIcon } from "@/components/ui/category-icon";

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

export default async function MyRequestsPage() {
  const requests = await getMyServiceRequests();

  const open   = requests.filter((r) => r.status === "OPEN").length;
  const active = requests.filter((r) => r.status === "IN_PROGRESS").length;
  const closed = requests.filter((r) => ["CLOSED", "CANCELLED"].includes(r.status)).length;

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
        <div className="grid grid-cols-3 gap-4">
          <StatBox label="Open" value={open} color="text-green-600" />
          <StatBox label="In Progress" value={active} color="text-blue-600" />
          <StatBox label="Closed / Cancelled" value={closed} color="text-gray-500" />
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
          {requests.map((req) => {
            const ui = STATUS_STYLES[req.status] ?? STATUS_STYLES.OPEN;
            const assignedName = req.assignedTo
              ? (req.assignedTo.user.displayName ??
                 [req.assignedTo.user.firstName, req.assignedTo.user.lastName].filter(Boolean).join(" "))
              : null;

            return (
              <div key={req.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
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
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 text-center">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{label}</p>
    </div>
  );
}
