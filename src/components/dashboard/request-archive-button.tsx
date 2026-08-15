"use client";

import { useTransition } from "react";
import { Archive, ArchiveRestore } from "lucide-react";
import { toast } from "sonner";
import { setMyServiceRequestArchivedState } from "@/lib/actions/service-requests";
import { ArchiveContextMenu } from "@/components/dashboard/archive-context-menu";

export function RequestArchiveButton({
  requestId,
  archived,
}: {
  requestId: string;
  archived: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  function updateArchivedState(nextArchived: boolean) {
    startTransition(async () => {
      try {
        await setMyServiceRequestArchivedState(requestId, nextArchived);
        if (nextArchived) {
          toast.success("Request archived", {
            duration: 6000,
            action: {
              label: "Undo",
              onClick: () => updateArchivedState(false),
            },
          });
        } else {
          toast.success("Request restored");
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not update this request right now.");
      }
    });
  }

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => updateArchivedState(!archived)}
      className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:border-gray-300 hover:text-gray-900 disabled:cursor-wait disabled:opacity-60 dark:border-gray-700 dark:text-gray-300 dark:hover:border-gray-600 dark:hover:text-white"
    >
      {archived ? <ArchiveRestore className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
      {isPending ? "Saving..." : archived ? "Restore" : "Archive"}
    </button>
  );
}

export function RequestArchiveContextCard({
  requestId,
  archived,
  enabled,
  children,
}: {
  requestId: string;
  archived: boolean;
  enabled: boolean;
  children: React.ReactNode;
}) {
  const [isPending, startTransition] = useTransition();

  function updateArchivedState(nextArchived: boolean) {
    startTransition(async () => {
      try {
        await setMyServiceRequestArchivedState(requestId, nextArchived);
        if (nextArchived) {
          toast.success("Request archived", {
            duration: 6000,
            action: {
              label: "Undo",
              onClick: () => updateArchivedState(false),
            },
          });
        } else {
          toast.success("Request restored");
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not update this request right now.");
      }
    });
  }

  return (
    <ArchiveContextMenu
      archived={archived}
      enabled={enabled}
      disabled={isPending}
      onSelect={() => updateArchivedState(!archived)}
    >
      {children}
    </ArchiveContextMenu>
  );
}
