"use client";

import { useState } from "react";
import { Flag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { reportRecommendation } from "@/lib/actions/recommendations";

const REASONS = [
  "Fake or not a real person",
  "Conflict of interest (friend, family, or the professional themselves)",
  "Spam or irrelevant content",
  "Harassment or hateful content",
  "False or misleading information",
];

interface Props {
  recommendationId: string;
  isLoggedIn: boolean;
}

export function ReportRecommendationButton({ recommendationId, isLoggedIn }: Props) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [detail, setDetail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  if (!isLoggedIn) return null;

  async function handleSubmit() {
    if (!reason) return;
    setStatus("submitting");
    try {
      await reportRecommendation(recommendationId, reason, detail.trim() || undefined);
      setStatus("done");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="ml-auto flex items-center gap-1 text-[11px] text-gray-300 hover:text-red-400 transition-colors"
        aria-label="Report this review"
      >
        <Flag className="h-3 w-3" />
        Report
      </button>
    );
  }

  return (
    <div className="mt-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4 text-sm">
      <div className="flex items-center justify-between mb-3">
        <p className="font-medium text-gray-800 dark:text-gray-200">Report this review</p>
        <button onClick={() => { setOpen(false); setStatus("idle"); setReason(""); setDetail(""); }} className="text-gray-400 hover:text-gray-600">
          <X className="h-4 w-4" />
        </button>
      </div>

      {status === "done" ? (
        <p className="text-green-700 dark:text-green-400 text-xs">
          Thank you — your report has been submitted and will be reviewed by our team.
        </p>
      ) : (
        <>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            Why are you reporting this review? Reports are anonymous and reviewed by our moderation team.
          </p>
          <div className="space-y-2 mb-3">
            {REASONS.map((r) => (
              <label key={r} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name={`report-reason-${recommendationId}`}
                  value={r}
                  checked={reason === r}
                  onChange={() => setReason(r)}
                  className="text-green-600 focus:ring-green-500"
                />
                <span className="text-xs text-gray-700 dark:text-gray-300">{r}</span>
              </label>
            ))}
          </div>
          <textarea
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            placeholder="Additional details (optional)"
            rows={2}
            maxLength={500}
            className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-green-500 mb-3"
          />
          {status === "error" && (
            <p className="text-xs text-red-600 mb-2">{errorMsg}</p>
          )}
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!reason || status === "submitting"}
              className="bg-red-600 hover:bg-red-700 text-white text-xs h-8 px-3"
            >
              {status === "submitting" ? "Submitting…" : "Submit Report"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => { setOpen(false); setReason(""); setDetail(""); setStatus("idle"); }}
              className="text-xs h-8 px-3"
            >
              Cancel
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
