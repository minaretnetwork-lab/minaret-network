"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { approveProfileClaim, rejectProfileClaim } from "@/lib/actions/admin";
import { Loader2, ExternalLink, CheckCircle, XCircle, Clock } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Claim {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  claimantName: string;
  claimantEmail: string;
  claimantPhone: string | null;
  claimantNote: string;
  adminNote: string | null;
  createdAt: Date;
  reviewedAt: Date | null;
  user: { id: string; displayName: string | null; firstName: string | null; lastName: string | null; email: string };
  professional: {
    id: string;
    businessName: string | null;
    title: string | null;
    isAdminCreated: boolean;
    claimedByUserId: string | null;
    category: { name: string };
  };
}

export function AdminClaimsClient({ claims }: { claims: Claim[] }) {
  if (claims.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-12 text-center">
        <p className="text-gray-500 dark:text-gray-400">No claims in this category.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {claims.map((claim) => (
        <ClaimCard key={claim.id} claim={claim} />
      ))}
    </div>
  );
}

function ClaimCard({ claim }: { claim: Claim }) {
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [rejectNote, setRejectNote] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  const bizName = claim.professional.businessName ?? claim.professional.title ?? "Unnamed";

  function handleApprove() {
    setActionError(null);
    startTransition(async () => {
      const res = await approveProfileClaim(claim.id);
      if (!res.ok) { setActionError(res.error ?? "Failed."); return; }
      setDone(true);
    });
  }

  function handleReject() {
    if (!rejecting) { setRejecting(true); return; }
    setActionError(null);
    startTransition(async () => {
      const res = await rejectProfileClaim(claim.id, rejectNote);
      if (!res.ok) { setActionError(res.error ?? "Failed."); return; }
      setDone(true);
    });
  }

  if (done) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-4 text-sm text-gray-400">
        Claim for <span className="font-medium text-gray-600 dark:text-gray-300">{bizName}</span> has been processed.
      </div>
    );
  }

  const statusIcon = {
    PENDING: <Clock className="h-4 w-4 text-amber-500" />,
    APPROVED: <CheckCircle className="h-4 w-4 text-emerald-500" />,
    REJECTED: <XCircle className="h-4 w-4 text-red-500" />,
  }[claim.status];

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 space-y-4 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {statusIcon}
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{claim.status}</span>
          </div>
          <Link
            href={`/admin/professionals/${claim.professional.id}`}
            className="text-base font-semibold text-gray-900 dark:text-white hover:text-emerald-700 dark:hover:text-emerald-400 flex items-center gap-1"
          >
            {bizName}
            <ExternalLink className="h-3.5 w-3.5 text-gray-400" />
          </Link>
          <p className="text-xs text-gray-400">{claim.professional.category.name}</p>
        </div>
        <div className="text-xs text-gray-400 text-right shrink-0">
          Submitted {formatDate(claim.createdAt)}
          {claim.reviewedAt && <><br />Reviewed {formatDate(claim.reviewedAt)}</>}
        </div>
      </div>

      {/* Claimant info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 text-sm">
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-0.5">Name</p>
          <p className="text-gray-900 dark:text-white font-medium">{claim.claimantName}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-0.5">Email</p>
          <a href={`mailto:${claim.claimantEmail}`} className="text-emerald-700 dark:text-emerald-400 hover:underline">
            {claim.claimantEmail}
          </a>
        </div>
        {claim.claimantPhone && (
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-0.5">Phone</p>
            <a href={`tel:${claim.claimantPhone}`} className="text-gray-700 dark:text-gray-300">
              {claim.claimantPhone}
            </a>
          </div>
        )}
        <div className="sm:col-span-2">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-0.5">Their explanation</p>
          <p className="text-gray-700 dark:text-gray-300 italic">&ldquo;{claim.claimantNote}&rdquo;</p>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-0.5">Account email</p>
          <p className="text-gray-500 text-xs">{claim.user.email}</p>
        </div>
      </div>

      {claim.adminNote && (
        <p className="text-xs text-gray-500 dark:text-gray-400 italic border-l-2 border-gray-200 dark:border-gray-700 pl-3">
          Admin note: {claim.adminNote}
        </p>
      )}

      {actionError && (
        <p className="text-xs text-red-600 dark:text-red-400">{actionError}</p>
      )}

      {/* Actions */}
      {claim.status === "PENDING" && (
        <div className="flex flex-wrap items-center gap-3">
          <Button
            size="sm"
            onClick={handleApprove}
            disabled={isPending}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {isPending && !rejecting && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}
            Approve claim
          </Button>

          {rejecting ? (
            <div className="flex items-center gap-2 flex-1">
              <input
                className="flex-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                placeholder="Reason for rejection…"
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                autoFocus
              />
              <Button size="sm" variant="destructive" onClick={handleReject} disabled={isPending}>
                {isPending && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}
                Confirm
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setRejecting(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="outline" onClick={handleReject}>
              Reject
            </Button>
          )}

          <Link
            href={`/professionals/${claim.professional.id}`}
            target="_blank"
            className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 flex items-center gap-1 ml-auto"
          >
            View profile <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}
