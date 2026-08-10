"use client";

import { useState, useTransition } from "react";
import { RotateCcw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { reopenMyServiceRequest } from "@/lib/actions/service-requests";

export function ReopenRequestButton({ requestId }: { requestId: string }) {
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function reopen() {
    setError("");
    startTransition(async () => {
      try {
        await reopenMyServiceRequest(requestId);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not reopen the request. Please try again.");
      }
    });
  }

  return (
    <div>
      <Button
        type="button"
        onClick={reopen}
        disabled={isPending}
        className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
        {isPending ? "Reopening..." : "Reopen request"}
      </Button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
