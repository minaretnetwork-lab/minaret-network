"use client";

import { useMemo, useState } from "react";
import { Bell, ChevronDown } from "lucide-react";

const STORAGE_KEY = "minaret_viewed_incoming_request_ids";

function readViewedIds() {
  if (typeof window === "undefined") return new Set<string>();

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const parsed = stored ? (JSON.parse(stored) as string[]) : [];
    return new Set(parsed);
  } catch {
    return new Set<string>();
  }
}

export function IncomingRequestsAlert({ requestIds }: { requestIds: string[] }) {
  const [viewedIds, setViewedIds] = useState(readViewedIds);

  const newIds = useMemo(() => {
    return requestIds.filter((id) => !viewedIds.has(id));
  }, [requestIds, viewedIds]);

  if (requestIds.length === 0) return null;

  function markViewedAndScroll() {
    const nextViewedIds = new Set([...(viewedIds ?? new Set<string>()), ...requestIds]);
    setViewedIds(nextViewedIds);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(nextViewedIds)));
    } catch {
      // If storage is unavailable, the scroll still matters.
    }
    document.getElementById("incoming-service-requests")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-950 shadow-sm dark:border-emerald-800/50 dark:bg-emerald-900/20 dark:text-emerald-100">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white text-emerald-700 shadow-sm dark:bg-emerald-950/60 dark:text-emerald-300">
          <Bell className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">You have incoming service requests</p>
          <p className="mt-0.5 text-xs text-emerald-800/75 dark:text-emerald-200/75">
            {newIds.length > 0
              ? "New requests matching your professional listings are waiting below."
              : "Open requests matching your professional listings are waiting below."}
          </p>
        </div>
        <button
          type="button"
          onClick={markViewedAndScroll}
          className="inline-flex flex-shrink-0 items-center gap-2 rounded-full bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
        >
          <span>{requestIds.length} open</span>
          {newIds.length > 0 && (
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">
              {newIds.length} new
            </span>
          )}
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
