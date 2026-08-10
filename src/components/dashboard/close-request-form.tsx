"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { closeMyServiceRequest } from "@/lib/actions/service-requests";
import { cn } from "@/lib/utils";

const REASONS = [
  "Service fulfilled",
  "Don’t need this service anymore",
  "Found someone outside Minaret",
  "Request was submitted by mistake",
  "Other",
];

export function CloseRequestForm({ requestId }: { requestId: string }) {
  const [reason, setReason] = useState(REASONS[0]);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function closeRequest() {
    setError("");
    startTransition(async () => {
      try {
        await closeMyServiceRequest(requestId, { reason, note });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not close the request. Please try again.");
      }
    });
  }

  return (
    <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5 dark:border-amber-800/40 dark:bg-amber-900/20">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white text-amber-600 dark:bg-amber-950">
          <XCircle className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold text-amber-950 dark:text-amber-100">Close this request</h2>
          <p className="mt-1 text-sm leading-relaxed text-amber-800 dark:text-amber-200">
            Close it when you no longer need responses. Matching professionals will stop seeing it as open.
          </p>

          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {REASONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setReason(option)}
                className={cn(
                  "rounded-xl border px-3 py-2 text-left text-sm font-medium transition",
                  reason === option
                    ? "border-amber-400 bg-white text-amber-900 shadow-sm"
                    : "border-amber-200 bg-amber-50/50 text-amber-800 hover:bg-white dark:border-amber-800/60 dark:bg-amber-950/20 dark:text-amber-200"
                )}
              >
                {option}
              </button>
            ))}
          </div>

          <Textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            maxLength={500}
            rows={3}
            placeholder="Optional note, e.g. who helped or why you closed it..."
            className="mt-3 resize-none bg-white dark:bg-amber-950/20"
          />

          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

          <Button
            type="button"
            onClick={closeRequest}
            disabled={isPending || !reason}
            className="mt-3 gap-1.5 bg-amber-600 text-white hover:bg-amber-700"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            {isPending ? "Closing..." : "Close request"}
          </Button>
        </div>
      </div>
    </div>
  );
}
