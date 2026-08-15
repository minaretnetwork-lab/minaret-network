"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { resolveReport, deleteRecommendation } from "@/lib/actions/recommendations";
import { useRouter } from "next/navigation";

interface Props {
  reportId: string;
  recommendationId: string;
  professionalId: string;
}

export function ReportActionsClient({ reportId, recommendationId, professionalId }: Props) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handle(action: "dismiss" | "action" | "action-and-delete") {
    setBusy(true);
    setError("");
    try {
      if (action === "dismiss") {
        await resolveReport(reportId, "DISMISSED", note.trim() || undefined);
      } else {
        await resolveReport(reportId, "ACTIONED", note.trim() || undefined);
        if (action === "action-and-delete") {
          await deleteRecommendation(recommendationId);
        }
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setBusy(false);
    }
  }

  return (
    <div className="border-t border-gray-100 dark:border-gray-700 pt-3 mt-3 space-y-2">
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Resolution note (optional)"
        rows={2}
        className="w-full rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => handle("dismiss")}
          disabled={busy}
          className="text-xs h-8"
        >
          Dismiss (no action)
        </Button>
        <Button
          size="sm"
          onClick={() => handle("action")}
          disabled={busy}
          className="bg-amber-600 hover:bg-amber-700 text-white text-xs h-8"
        >
          Mark actioned (keep review)
        </Button>
        <Button
          size="sm"
          onClick={() => handle("action-and-delete")}
          disabled={busy}
          className="bg-red-600 hover:bg-red-700 text-white text-xs h-8"
        >
          Remove review
        </Button>
      </div>
    </div>
  );
}
