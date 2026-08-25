"use client";

import { useState } from "react";
import { Copy, Link2, RefreshCw, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateClaimInvite, revokeClaimInvite } from "@/lib/actions/claim-invite";

export function ClaimInvitePanel({
  professionalId,
  isClaimed,
  existingToken,
  existingExpiry,
}: {
  professionalId: string;
  isClaimed: boolean;
  existingToken: string | null;
  existingExpiry: Date | null;
}) {
  const [token, setToken] = useState(existingToken);
  const [expiry, setExpiry] = useState(existingExpiry);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  if (isClaimed) {
    return (
      <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">
        ✓ This listing has been claimed by the business owner.
      </p>
    );
  }

  const claimUrl = token
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/claim/${token}`
    : null;

  async function handleGenerate() {
    setLoading(true);
    try {
      const newToken = await generateClaimInvite(professionalId);
      setToken(newToken);
      setExpiry(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
    } finally {
      setLoading(false);
    }
  }

  async function handleRevoke() {
    if (!confirm("Revoke this invite link? The business owner won't be able to use it.")) return;
    setLoading(true);
    try {
      await revokeClaimInvite(professionalId);
      setToken(null);
      setExpiry(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!claimUrl) return;
    await navigator.clipboard.writeText(claimUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-3">
      {token && claimUrl ? (
        <>
          <div className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2">
            <Link2 className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <span className="text-xs text-gray-600 dark:text-gray-400 font-mono truncate flex-1">
              {claimUrl}
            </span>
            <button
              onClick={handleCopy}
              className="flex-shrink-0 text-gray-400 hover:text-emerald-600 transition-colors"
              title="Copy link"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
          {expiry && (
            <p className="text-xs text-gray-400">
              Expires {new Date(expiry).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" })}
            </p>
          )}
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handleGenerate} disabled={loading} className="text-xs gap-1">
              <RefreshCw className="h-3 w-3" />
              Regenerate
            </Button>
            <Button size="sm" variant="outline" onClick={handleRevoke} disabled={loading} className="text-xs gap-1 text-red-600 hover:text-red-700 border-red-200 hover:border-red-300">
              <Trash2 className="h-3 w-3" />
              Revoke
            </Button>
          </div>
        </>
      ) : (
        <Button size="sm" onClick={handleGenerate} disabled={loading} className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs gap-1.5">
          <Link2 className="h-3 w-3" />
          {loading ? "Generating…" : "Generate claim link"}
        </Button>
      )}
      <p className="text-xs text-gray-400">
        Send this link to the business owner. They&apos;ll sign in and confirm ownership. Link expires in 30 days.
      </p>
    </div>
  );
}
