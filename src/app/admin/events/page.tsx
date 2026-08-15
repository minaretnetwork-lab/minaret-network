export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { AdminEventActionsClient } from "./events-client";
import { Sparkles } from "lucide-react";

export const metadata = { title: "Event Listings — Admin" };

const STATUS_BADGE: Record<string, string> = {
  PENDING_PAYMENT: "border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300",
  ACTIVE:          "border-green-200 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300",
  EXPIRED:         "border-gray-200 bg-gray-50 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
  REMOVED:         "border-red-200 bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-300",
};

export default async function AdminEventsPage() {
  const events = await prisma.eventListing.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      reports: { where: { status: "OPEN" }, select: { id: true } },
    },
  });

  const pending = events.filter((e) => e.status === "PENDING_PAYMENT");
  const active  = events.filter((e) => e.status === "ACTIVE");
  const other   = events.filter((e) => e.status === "EXPIRED" || e.status === "REMOVED");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Event Listings
          {active.length > 0 && (
            <span className="ml-3 inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/30 px-2.5 py-0.5 text-sm font-semibold text-green-700 dark:text-green-300">
              {active.length} active
            </span>
          )}
          {pending.length > 0 && (
            <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 dark:bg-amber-900/30 px-2.5 py-0.5 text-sm font-semibold text-amber-700 dark:text-amber-300">
              {pending.length} pending payment
            </span>
          )}
        </h1>
      </div>

      {events.length === 0 && (
        <p className="text-sm text-gray-400">No event listings yet.</p>
      )}

      {[
        { label: "Pending Payment", rows: pending },
        { label: "Active", rows: active },
        { label: "Expired / Removed", rows: other },
      ].map(({ label, rows }) =>
        rows.length === 0 ? null : (
          <section key={label}>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              {label}
            </h2>
            <div className="space-y-3">
              {rows.map((event) => (
                <div
                  key={event.id}
                  className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ${STATUS_BADGE[event.status]}`}>
                          {event.status.replace("_", " ")}
                        </span>
                        {event.listingType === "FEATURED" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-700 px-2 py-0.5 text-xs font-semibold text-violet-700 dark:text-violet-300">
                            <Sparkles className="h-3 w-3" />
                            Featured
                          </span>
                        )}
                        {event.isMosqueOrganized && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                            🕌 Mosque
                          </span>
                        )}
                        {event.reports.length > 0 && (
                          <span className="inline-flex items-center rounded-full bg-red-100 dark:bg-red-900/20 border border-red-200 px-2 py-0.5 text-xs font-semibold text-red-600">
                            {event.reports.length} report{event.reports.length > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{event.title}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {event.organizerName} · {event.location} ·{" "}
                        {new Date(event.eventDate).toLocaleDateString("en-CA")}
                      </p>
                      {event.status === "ACTIVE" && event.expiresAt && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          Expires {formatDate(event.expiresAt)}
                        </p>
                      )}
                      {event.status === "REMOVED" && event.removalReason && (
                        <p className="text-xs text-red-500 mt-1">
                          Removed: {event.removalReason}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-0.5">
                        {event.priceChargedCents === 0 ? "Free (mosque)" : `$${(event.priceChargedCents / 100).toFixed(2)} CAD`}
                        {" · "}Created {formatDate(event.createdAt)}
                      </p>
                    </div>

                    {event.status !== "REMOVED" && event.status !== "EXPIRED" && (
                      <AdminEventActionsClient eventId={event.id} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )
      )}
    </div>
  );
}
