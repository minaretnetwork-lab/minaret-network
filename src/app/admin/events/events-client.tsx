"use client";

import { useState } from "react";
import { CheckCircle, Trash2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { adminRemoveEventListing, adminApproveEventListing, adminSetEventFeatured } from "@/lib/actions/event-listings";
import { useRouter } from "next/navigation";

export function AdminEventActionsClient({
  eventId,
  canApprove,
  isFeatured,
  isActive,
}: {
  eventId: string;
  canApprove?: boolean;
  isFeatured?: boolean;
  isActive?: boolean;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"idle" | "remove">("idle");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleApprove() {
    setLoading(true);
    try {
      await adminApproveEventListing(eventId);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleFeatured() {
    setLoading(true);
    try {
      await adminSetEventFeatured(eventId, !isFeatured);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove() {
    if (!reason.trim()) return;
    setLoading(true);
    try {
      await adminRemoveEventListing(eventId, reason.trim());
      router.refresh();
    } finally {
      setLoading(false);
      setMode("idle");
    }
  }

  if (mode === "remove") {
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
            disabled={!reason.trim() || loading}
            className="bg-red-600 hover:bg-red-700 text-white text-xs"
          >
            {loading ? "Removing…" : "Confirm"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setMode("idle")} className="text-xs">
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-shrink-0 flex items-center gap-2">
      {canApprove && (
        <Button
          size="sm"
          onClick={handleApprove}
          disabled={loading}
          className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs"
        >
          <CheckCircle className="h-3.5 w-3.5 mr-1" />
          {loading ? "Approving…" : "Approve"}
        </Button>
      )}
      {isActive && (
        <Button
          size="sm"
          variant="outline"
          onClick={handleToggleFeatured}
          disabled={loading}
          className={isFeatured
            ? "border-violet-300 text-violet-700 hover:bg-violet-50 dark:border-violet-700 dark:text-violet-400 dark:hover:bg-violet-900/20 text-xs"
            : "border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-900/20 text-xs"}
        >
          <Star className={`h-3.5 w-3.5 mr-1 ${isFeatured ? "fill-violet-600 text-violet-600" : ""}`} />
          {isFeatured ? "Unfeature" : "Make Featured"}
        </Button>
      )}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setMode("remove")}
        className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20 text-xs"
      >
        <Trash2 className="h-3.5 w-3.5 mr-1" />
        Remove
      </Button>
    </div>
  );
}
