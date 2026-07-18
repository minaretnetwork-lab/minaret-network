"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { approveProfessional, rejectProfessional, suspendProfessional, awardBadge, revokeBadge } from "@/lib/actions/admin";
import { CheckCircle, XCircle, AlertCircle, ExternalLink, Check, Plus, Sparkles } from "lucide-react";

type Professional = {
  id: string;
  status: string;
  submittedAt: Date;
  isSponsored: boolean;
  user: { firstName: string | null; lastName: string | null; displayName: string | null; email: string };
  mosque: {
    name: string;
    communityChannelType: string | null;
    communityChannelName: string | null;
    communityChannelLink: string | null;
  } | null;
  category: { id: string; name: string; slug: string };
  badges: { type: string }[];
  recommendations: { id: string }[];
  credentials: { id: string; name: string; isVerified: boolean }[];
};

const STATUS_BADGE: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700 border-amber-200",
  APPROVED: "bg-green-100 text-green-700 border-green-200",
  REJECTED: "bg-red-100 text-red-700 border-red-200",
  SUSPENDED: "bg-gray-100 text-gray-600 border-gray-200",
};

interface Props {
  professionals: Professional[];
}

export function AdminProfessionalTable({ professionals }: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  async function handleApprove(id: string) {
    setLoading(id + "-approve");
    await approveProfessional(id);
    setLoading(null);
  }

  async function handleReject(id: string) {
    if (!rejectReason.trim()) return;
    setLoading(id + "-reject");
    await rejectProfessional(id, rejectReason);
    setRejectId(null);
    setRejectReason("");
    setLoading(null);
  }

  async function handleSuspend(id: string) {
    setLoading(id + "-suspend");
    await suspendProfessional(id);
    setLoading(null);
  }

  async function handleToggleBadge(professionalId: string, type: string, hasBadge: boolean) {
    setLoading(professionalId + "-badge-" + type);
    if (hasBadge) {
      await revokeBadge(professionalId, type);
    } else {
      await awardBadge(professionalId, type);
    }
    setLoading(null);
  }

  if (professionals.length === 0) {
    return (
      <div className="text-center py-16 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl">
        <p className="text-gray-400 text-sm">No professionals found for this filter.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {professionals.map((p) => {
        const name = p.user.displayName ?? [p.user.firstName, p.user.lastName].filter(Boolean).join(" ") ?? p.user.email;
        const hasMosqueAffiliated = p.badges.some((b) => b.type === "MOSQUE_AFFILIATED");
        const hasHighlyRecommended = p.badges.some((b) => b.type === "HIGHLY_RECOMMENDED");
        const channelType = p.mosque?.communityChannelType ?? "WhatsApp";
        const channelName = p.mosque?.communityChannelName;
        const channelLink = p.mosque?.communityChannelLink;

        return (
          <div key={p.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{name}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_BADGE[p.status] ?? ""}`}>
                    {p.status}
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{p.user.email}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {p.category.name} · {p.recommendations.length} recommendations
                </p>

                {/* Mosque affiliation + verification channel */}
                <div className="mt-2 flex items-start gap-2 flex-wrap">
                  {p.mosque ? (
                    <>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Claims affiliation with <span className="font-medium text-gray-700 dark:text-gray-300">{p.mosque.name}</span>
                      </span>
                      {channelLink ? (
                        <a
                          href={channelLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400 hover:underline font-medium"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Check {channelType} group
                        </a>
                      ) : channelName ? (
                        <span className="text-xs text-gray-400">
                          Verify via: {channelType} — {channelName}
                        </span>
                      ) : null}
                    </>
                  ) : (
                    <span className="text-xs text-amber-600">Mosque not listed — affiliation cannot be verified</span>
                  )}
                </div>

                {/* Badges */}
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => handleToggleBadge(p.id, "MOSQUE_AFFILIATED", hasMosqueAffiliated)}
                    disabled={!!loading || !p.mosque}
                    title={!p.mosque ? "No mosque selected — cannot confirm affiliation" : hasMosqueAffiliated ? "Revoke mosque affiliation" : "Confirm mosque affiliation"}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                      hasMosqueAffiliated
                        ? "bg-green-100 text-green-700 border-green-300"
                        : !p.mosque
                        ? "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed"
                        : "bg-gray-50 text-gray-500 border-gray-200 hover:border-green-300 hover:text-green-600"
                    }`}
                  >
                    {hasMosqueAffiliated ? <Check className="inline h-3 w-3 mr-1" /> : <Plus className="inline h-3 w-3 mr-1" />}
                    {p.mosque ? `Affiliated with ${p.mosque.name}` : "No mosque listed"}
                  </button>
                  <button
                    onClick={() => handleToggleBadge(p.id, "HIGHLY_RECOMMENDED", hasHighlyRecommended)}
                    disabled={!!loading}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                      hasHighlyRecommended
                        ? "bg-amber-100 text-amber-700 border-amber-300"
                        : "bg-gray-50 text-gray-500 border-gray-200 hover:border-amber-300 hover:text-amber-600"
                    }`}
                  >
                    {hasHighlyRecommended ? <Check className="inline h-3 w-3 mr-1" /> : <Plus className="inline h-3 w-3 mr-1" />}
                    Highly Recommended
                  </button>
                </div>

                {p.isSponsored && (
                  <div className="mt-2">
                    <span className="text-xs text-violet-700 font-medium flex items-center gap-1"><Sparkles className="h-3 w-3" /> Sponsored listing active</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 flex-shrink-0">
                {p.status === "PENDING" && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => handleApprove(p.id)}
                      disabled={!!loading}
                      className="bg-green-600 hover:bg-green-700 text-white gap-1.5"
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setRejectId(p.id)}
                      disabled={!!loading}
                      className="border-red-200 text-red-700 hover:bg-red-50 gap-1.5"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Reject
                    </Button>
                  </>
                )}
                {p.status === "APPROVED" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSuspend(p.id)}
                    disabled={!!loading}
                    className="border-amber-200 text-amber-700 hover:bg-amber-50 gap-1.5"
                  >
                    <AlertCircle className="h-3.5 w-3.5" />
                    Suspend
                  </Button>
                )}
                {(p.status === "REJECTED" || p.status === "SUSPENDED") && (
                  <Button
                    size="sm"
                    onClick={() => handleApprove(p.id)}
                    disabled={!!loading}
                    className="bg-green-600 hover:bg-green-700 text-white gap-1.5"
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    Approve
                  </Button>
                )}
              </div>
            </div>

            {/* Rejection form */}
            {rejectId === p.id && (
              <div className="mt-4 border-t border-gray-100 dark:border-gray-800 pt-4">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5 block">
                  Reason for rejection *
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 resize-none focus:outline-none focus:ring-2 focus:ring-red-400"
                  rows={2}
                  placeholder="Explain why this application is being rejected…"
                />
                <div className="flex gap-2 mt-2">
                  <Button size="sm" onClick={() => handleReject(p.id)} disabled={!rejectReason.trim() || !!loading}
                    className="bg-red-600 hover:bg-red-700 text-white">
                    Confirm Rejection
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { setRejectId(null); setRejectReason(""); }}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
