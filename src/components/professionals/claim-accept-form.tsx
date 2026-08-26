"use client";

import { useState } from "react";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { acceptClaimInvite } from "@/lib/actions/claim-invite";

export function ClaimAcceptForm({ token, businessName }: { token: string; businessName: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleClaim() {
    setLoading(true);
    setError(null);
    try {
      await acceptClaimInvite(token);
      try { localStorage.removeItem("mn_oauth_next"); } catch {}
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="text-center space-y-4">
        <CheckCircle className="h-12 w-12 text-emerald-600 mx-auto" />
        <div className="space-y-1">
          <p className="font-semibold text-gray-900 dark:text-white text-lg">Listing claimed!</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            You now own <strong>{businessName}</strong> on Minaret Network.
          </p>
        </div>
        <div className="flex flex-col gap-2 pt-1">
          <a
            href="/dashboard/professional"
            className="inline-flex items-center justify-center w-full h-11 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold transition-colors"
          >
            Update my profile details
          </a>
          <a
            href="/dashboard"
            className="inline-flex items-center justify-center w-full h-10 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Go to dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {error}
        </p>
      )}
      <Button
        onClick={handleClaim}
        disabled={loading}
        className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-3"
      >
        {loading ? "Claiming…" : `Claim "${businessName}"`}
      </Button>
    </div>
  );
}
