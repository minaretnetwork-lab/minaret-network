"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { adminRemoveEventListing } from "@/lib/actions/event-listings";
import { useRouter } from "next/navigation";

export function AdminEventActionsClient({ eventId }: { eventId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [removing, setRemoving] = useState(false);

  async function handleRemove() {
    if (!reason.trim()) return;
    setRemoving(true);
    try {
      await adminRemoveEventListing(eventId, reason.trim());
      router.refresh();
    } finally {
      setRemoving(false);
      setOpen(false);
    }
  }

  if (!open) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="flex-shrink-0 border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20 text-xs"
      >
        <Trash2 className="h-3.5 w-3.5 mr-1" />
        Remove
      </Button>
    );
  }

  return (
    <div className="flex-shrink-0 w-56 space-y-2">
      <textarea
        placeholder="Reason for removal (required)"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={2}
        className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-2.5 py-1.5 text-xs text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
        autoFocus
      />
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={handleRemove}
          disabled={!reason.trim() || removing}
          className="bg-red-600 hover:bg-red-700 text-white text-xs"
        >
          {removing ? "Removing…" : "Confirm"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setOpen(false)}
          className="text-xs"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
