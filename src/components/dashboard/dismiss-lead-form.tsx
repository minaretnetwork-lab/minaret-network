"use client";

import { useState, useTransition } from "react";
import { BanIcon, ChevronDown, ChevronUp, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { dismissLead } from "@/lib/actions/service-requests";
import { cn } from "@/lib/utils";

const REASONS = [
  "Already booked for this period",
  "Outside my service area",
  "Request is too old",
  "Not the right fit for my services",
  "Client found someone else",
  "Other",
];

export function DismissLeadForm({ serviceRequestId }: { serviceRequestId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(REASONS[0]);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function dismiss() {
    setError("");
    startTransition(async () => {
      try {
        await dismissLead(serviceRequestId, { reason, note });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not dismiss. Please try again.");
      }
    });
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/30">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400">
          <BanIcon className="h-4 w-4" />
          Not interested in this lead?
        </span>
        {open ? (
          <ChevronUp className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        )}
      </button>

      {open && (
        <div className="border-t border-gray-200 px-5 pb-5 dark:border-gray-800">
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
            This lead will be removed from your inbox. The requester will still hear from other professionals.
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
                    ? "border-gray-400 bg-white text-gray-900 shadow-sm dark:border-gray-500 dark:bg-gray-800 dark:text-white"
                    : "border-gray-200 bg-white/50 text-gray-600 hover:bg-white dark:border-gray-700 dark:bg-gray-800/40 dark:text-gray-300"
                )}
              >
                {option}
              </button>
            ))}
          </div>

          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={500}
            rows={2}
            placeholder="Optional note for your own records…"
            className="mt-3 resize-none bg-white dark:bg-gray-800"
          />

          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

          <div className="mt-3 flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={dismiss}
              disabled={isPending || !reason}
              className="gap-1.5 border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
              {isPending ? "Dismissing…" : "Remove from my inbox"}
            </Button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-sm text-gray-400 hover:text-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
