"use client";

import { useState } from "react";
import { Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { reportProfessional } from "@/lib/actions/professionals";

const REASONS = [
  "Wrong contact information",
  "Business is closed or no longer operating",
  "False claim — this person doesn't own this business",
  "Impersonation or fake profile",
  "Inappropriate or misleading content",
  "Other",
];

export function ReportProfessionalButton({ professionalId }: { professionalId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [detail, setDetail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason) return;
    setSubmitting(true);
    try {
      await reportProfessional(professionalId, reason, detail);
      setDone(true);
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <p className="text-xs text-emerald-700 dark:text-emerald-400 text-center mt-3">
        Thank you — your report has been submitted for review.
      </p>
    );
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors w-full justify-center"
      >
        <Flag className="h-3 w-3" />
        Report a Mistake
      </button>

      {open && (
        <form
          onSubmit={handleSubmit}
          className="mt-3 space-y-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-4 text-left"
        >
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">What&apos;s the issue?</p>
          <div className="space-y-1.5">
            {REASONS.map((r) => (
              <label key={r} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                <input
                  type="radio"
                  name="reason"
                  value={r}
                  checked={reason === r}
                  onChange={() => setReason(r)}
                  className="mt-0.5 accent-emerald-600 flex-shrink-0"
                />
                {r}
              </label>
            ))}
          </div>
          <textarea
            placeholder="Additional details (optional)"
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
          />
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={!reason || submitting} className="bg-red-600 hover:bg-red-700 text-white text-xs">
              {submitting ? "Submitting…" : "Submit report"}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)} className="text-xs">
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
