export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { ReportActionsClient } from "./reports-client";

export const metadata = { title: "Review Reports" };

export default async function AdminReportsPage() {
  const reports = await prisma.recommendationReport.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: {
      reportedBy: { select: { displayName: true, firstName: true, lastName: true, email: true } },
      recommendation: {
        include: {
          professional: {
            include: {
              user: { select: { displayName: true, firstName: true, lastName: true } },
            },
          },
          user: { select: { displayName: true, firstName: true, lastName: true } },
        },
      },
    },
  });

  const open = reports.filter((r) => r.status === "OPEN" || r.status === "REVIEWING");
  const resolved = reports.filter((r) => r.status === "ACTIONED" || r.status === "DISMISSED");

  function reporterName(r: typeof reports[number]) {
    const u = r.reportedBy;
    return u.displayName ?? [u.firstName, u.lastName].filter(Boolean).join(" ") ?? u.email;
  }
  function reviewerName(r: typeof reports[number]) {
    const u = r.recommendation.user;
    return u.displayName ?? [u.firstName, u.lastName].filter(Boolean).join(" ") ?? "Unknown";
  }
  function professionalName(r: typeof reports[number]) {
    const u = r.recommendation.professional.user;
    return u.displayName ?? [u.firstName, u.lastName].filter(Boolean).join(" ") ?? "Unknown";
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Review Reports
          {open.length > 0 && (
            <span className="ml-3 inline-flex items-center rounded-full bg-red-100 dark:bg-red-900/30 px-2.5 py-0.5 text-sm font-semibold text-red-700 dark:text-red-300">
              {open.length} open
            </span>
          )}
        </h1>
      </div>

      {open.length === 0 && resolved.length === 0 && (
        <p className="text-sm text-gray-400">No review reports yet.</p>
      )}

      {open.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-3">Open</h2>
          <div className="space-y-4">
            {open.map((r) => (
              <div key={r.id} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 shadow-sm">
                <div className="flex flex-wrap items-start gap-x-4 gap-y-1 mb-3">
                  <span className="inline-flex items-center rounded-full bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wide">
                    {r.status}
                  </span>
                  <span className="text-xs text-gray-400">{formatDate(r.createdAt)}</span>
                  <span className="text-xs text-gray-500">Reported by: <strong>{reporterName(r)}</strong></span>
                </div>

                <div className="mb-3 rounded-lg bg-gray-50 dark:bg-gray-800 p-3 text-sm border border-gray-100 dark:border-gray-700">
                  <p className="text-xs text-gray-400 mb-1">
                    Review by <strong>{reviewerName(r)}</strong> on{" "}
                    <Link href={`/professionals/${r.recommendation.professionalId}`} className="text-green-700 hover:underline">
                      {professionalName(r)}&apos;s profile
                    </Link>
                  </p>
                  <p className="text-gray-700 dark:text-gray-300 text-sm line-clamp-3">{r.recommendation.content}</p>
                </div>

                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">Reason: {r.reason}</p>
                {r.detail && <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{r.detail}</p>}

                <ReportActionsClient
                  reportId={r.id}
                  recommendationId={r.recommendationId}
                  professionalId={r.recommendation.professionalId}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {resolved.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-3 mt-6">Resolved</h2>
          <div className="space-y-3">
            {resolved.map((r) => (
              <div key={r.id} className="rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-4 text-sm">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-2">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ${
                    r.status === "ACTIONED"
                      ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700"
                  }`}>
                    {r.status}
                  </span>
                  <span className="text-xs text-gray-400">{formatDate(r.createdAt)}</span>
                  <span className="text-xs text-gray-500">
                    <strong>{professionalName(r)}</strong> — {r.reason}
                  </span>
                </div>
                {r.resolutionNote && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">Note: {r.resolutionNote}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
