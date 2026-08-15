"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { Archive, Clock } from "lucide-react";
import { toast } from "sonner";
import { setMyServiceRequestArchivedState } from "@/lib/actions/service-requests";
import { CategoryIcon } from "@/components/ui/category-icon";
import { formatDate } from "@/lib/utils";
import { ArchiveContextMenu } from "@/components/dashboard/archive-context-menu";

type RecentRequest = {
  id: string;
  description: string;
  status: string;
  createdAt: Date;
  category: {
    name: string;
    slug: string;
  };
};

function isClosedStatus(status: string) {
  return status === "CLOSED" || status === "CANCELLED";
}

export function RecentRequestsPanel({ requests }: { requests: RecentRequest[] }) {
  const [openSwipeId, setOpenSwipeId] = useState<string | null>(null);
  const [dragState, setDragState] = useState<{ id: string; startX: number; deltaX: number } | null>(null);
  const [errorById, setErrorById] = useState<Record<string, string | null>>({});
  const [isPending, startTransition] = useTransition();

  const sortedRequests = useMemo(() => {
    return [...requests].sort((a, b) => {
      const aClosed = isClosedStatus(a.status);
      const bClosed = isClosedStatus(b.status);
      if (aClosed !== bClosed) return aClosed ? 1 : -1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [requests]);

  const recentRequests = sortedRequests.slice(0, 3);

  function beginSwipe(id: string, clientX: number) {
    if (!isClosedStatus(recentRequests.find((request) => request.id === id)?.status ?? "")) return;
    setDragState({ id, startX: clientX, deltaX: 0 });
  }

  function updateSwipe(clientX: number) {
    setDragState((current) => {
      if (!current) return null;
      const deltaX = Math.min(0, clientX - current.startX);
      return { ...current, deltaX };
    });
  }

  function endSwipe() {
    if (!dragState) return;
    setOpenSwipeId(dragState.deltaX <= -72 ? dragState.id : null);
    setDragState(null);
  }

  function archiveRequest(id: string) {
    setErrorById((current) => ({ ...current, [id]: null }));
    startTransition(async () => {
      try {
        await setMyServiceRequestArchivedState(id, true);
        setOpenSwipeId((current) => (current === id ? null : current));
        toast.success("Request archived", {
          duration: 6000,
          action: {
            label: "Undo",
            onClick: () => {
              startTransition(async () => {
                try {
                  await setMyServiceRequestArchivedState(id, false);
                  toast.success("Request restored");
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Could not restore this request right now.");
                }
              });
            },
          },
        });
      } catch (error) {
        setErrorById((current) => ({
          ...current,
          [id]: error instanceof Error ? error.message : "Could not archive this request right now.",
        }));
      }
    });
  }

  if (recentRequests.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-gray-400">No requests yet.</p>
        <Link href="/request" className="mt-3 inline-block rounded-md border border-green-300 px-3 py-2 text-sm font-medium text-green-700 transition hover:bg-green-50">
          Submit a Request
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {recentRequests.map((req) => {
        const closed = isClosedStatus(req.status);
        const isOpen = openSwipeId === req.id;
        const isDragging = dragState?.id === req.id;
        const dragOffset = isDragging ? Math.max(-96, dragState.deltaX) : isOpen ? -88 : 0;

        return (
          <ArchiveContextMenu
            key={req.id}
            archived={false}
            enabled={closed}
            disabled={isPending}
            onSelect={() => archiveRequest(req.id)}
          >
          <div className="space-y-1">
            <div className="relative overflow-hidden rounded-lg">
              {closed && (
                <div className="absolute inset-y-0 right-0 flex w-24 items-center justify-center rounded-lg bg-gray-900 text-white">
                  <button
                    type="button"
                    onClick={() => archiveRequest(req.id)}
                    disabled={isPending}
                    className="flex h-full w-full flex-col items-center justify-center gap-1 text-xs font-medium"
                  >
                    <Archive className="h-4 w-4" />
                    {isPending ? "Saving..." : "Archive"}
                  </button>
                </div>
              )}

              <Link
                href={`/dashboard/requests/${req.id}`}
                className="group relative flex items-start gap-3 rounded-lg bg-gray-50 p-3 transition-[transform,background-color] hover:bg-emerald-50 dark:bg-gray-800/50 dark:hover:bg-emerald-900/10"
                style={{ transform: `translateX(${dragOffset}px)` }}
                onTouchStart={(event) => beginSwipe(req.id, event.touches[0].clientX)}
                onTouchMove={(event) => updateSwipe(event.touches[0].clientX)}
                onTouchEnd={endSwipe}
                onMouseDown={(event) => {
                  if (window.innerWidth >= 768) return;
                  beginSwipe(req.id, event.clientX);
                }}
                onMouseMove={(event) => {
                  if (!dragState) return;
                  updateSwipe(event.clientX);
                }}
                onMouseUp={endSwipe}
                onMouseLeave={endSwipe}
              >
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 dark:bg-gray-800">
                  <CategoryIcon slug={req.category.slug} className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 transition-colors group-hover:text-emerald-700 dark:text-white">
                    {req.category.name}
                  </p>
                  <p className="truncate text-xs text-gray-500 dark:text-gray-400">{req.description}</p>
                </div>
                <div className="flex flex-shrink-0 flex-col items-end gap-1">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      req.status === "OPEN"
                        ? "bg-green-100 text-green-700"
                        : req.status === "IN_PROGRESS"
                          ? "bg-blue-100 text-blue-700"
                          : req.status === "CLOSED"
                            ? "bg-gray-100 text-gray-600"
                            : "bg-red-100 text-red-700"
                    }`}
                  >
                    {req.status.replace("_", " ")}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <Clock className="h-3 w-3" />
                    {formatDate(req.createdAt)}
                  </span>
                </div>
              </Link>
            </div>
            {closed && !isOpen && (
              <p className="px-1 text-[11px] text-gray-400 md:hidden">Swipe left to archive</p>
            )}
            {errorById[req.id] && <p className="px-1 text-xs text-red-600">{errorById[req.id]}</p>}
          </div>
          </ArchiveContextMenu>
        );
      })}
    </div>
  );
}
