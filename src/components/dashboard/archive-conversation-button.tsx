"use client";

import { useState, useTransition } from "react";
import { Archive, ArchiveRestore } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { setConversationArchivedState } from "@/lib/actions/messages";

export function ArchiveConversationButton({
  conversationId,
  archived,
}: {
  conversationId: string;
  archived: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function updateArchivedState(nextArchived: boolean) {
    setError(null);
    startTransition(async () => {
      try {
        await setConversationArchivedState(conversationId, nextArchived);
        if (nextArchived) {
          toast.success("Conversation archived", {
            duration: 6000,
            action: {
              label: "Undo",
              onClick: () => updateArchivedState(false),
            },
          });
        } else {
          toast.success("Conversation restored");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not update this conversation right now.");
        toast.error(err instanceof Error ? err.message : "Could not update this conversation right now.");
      }
    });
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant={archived ? "outline" : "default"}
        className={archived ? "gap-1.5" : "gap-1.5 bg-gray-900 text-white hover:bg-gray-800"}
        disabled={isPending}
        onClick={() => updateArchivedState(!archived)}
      >
        {archived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
        {isPending ? "Saving..." : archived ? "Restore conversation" : "Archive conversation"}
      </Button>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
