"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { acceptClaimInvite } from "@/lib/actions/claim-invite";

export function ClaimAcceptForm({ token, businessName }: { token: string; businessName: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClaim() {
    setLoading(true);
    setError(null);
    try {
      await acceptClaimInvite(token);
      try { localStorage.removeItem("mn_oauth_next"); } catch {}
      // Navigate away immediately before Next.js can rerender the server component
      // (which would show "invalid/expired" since the token was just cleared)
      window.location.replace(`/dashboard/professional?claimed=1&name=${encodeURIComponent(businessName)}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
      setLoading(false);
    }
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
