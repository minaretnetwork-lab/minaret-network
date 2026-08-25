"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { acceptClaimInvite } from "@/lib/actions/claim-invite";

export function ClaimAcceptForm({ token, businessName }: { token: string; businessName: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleClaim() {
    setLoading(true);
    setError(null);
    try {
      const professionalId = await acceptClaimInvite(token);
      setDone(true);
      setTimeout(() => router.push(`/professionals/${professionalId}`), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="text-center space-y-2">
        <CheckCircle className="h-10 w-10 text-emerald-600 mx-auto" />
        <p className="font-semibold text-gray-900 dark:text-white">Listing claimed!</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          You now own <strong>{businessName}</strong> on Minaret Network. Redirecting to your profile…
        </p>
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
