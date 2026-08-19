"use client";

import Image from "next/image";
import { useState } from "react";
import { CheckCircle, XCircle, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { approveOffer, rejectOffer } from "@/lib/actions/offers";

type AdminOffer = {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  tier: string;
  status: string;
  adminNote: string | null;
  createdAt: string;
  startDate: string | null;
  expiresAt: string | null;
  professional: {
    phone: string | null;
    whatsapp: string | null;
    user: {
      firstName: string | null;
      lastName: string | null;
      displayName: string | null;
      email: string;
    };
    category: { name: string; slug: string; icon: string } | null;
  };
};

interface Props {
  pending: AdminOffer[];
  active: AdminOffer[];
  recent: AdminOffer[];
}

const TIER_LABELS: Record<string, { label: string; color: string }> = {
  WEEKEND:  { label: "Weekend (3d)",  color: "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400" },
  STANDARD: { label: "Standard (1w)", color: "bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400" },
  FEATURED: { label: "Featured (1m)", color: "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400" },
};

function OfferRow({ offer, showActions }: { offer: AdminOffer; showActions: boolean }) {
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [done, setDone] = useState(false);

  const fullName = `${offer.professional.user.firstName ?? ""} ${offer.professional.user.lastName ?? ""}`.trim();
  const proName = offer.professional.user.displayName ?? (fullName || offer.professional.user.email);

  const tierUi = TIER_LABELS[offer.tier] ?? { label: offer.tier, color: "bg-gray-100 text-gray-700" };
  const startAt = offer.startDate ? new Date(offer.startDate) : null;
  const expiresAt = offer.expiresAt ? new Date(offer.expiresAt) : null;
  const fmt = (d: Date) => d.toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" });
  const isExpiredWindow = expiresAt && expiresAt < new Date();

  if (done) return null;

  return (
    <div className="flex flex-col sm:flex-row gap-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
      {offer.imageUrl && (
        <div className="relative w-full sm:w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden">
          <Image src={offer.imageUrl} alt={offer.title} fill className="object-cover" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${tierUi.color}`}>
            {tierUi.label}
          </span>
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{offer.title}</h3>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">{offer.description}</p>
        <div className="flex flex-wrap gap-3 text-xs text-gray-400">
          <span>{offer.professional.category?.icon} {offer.professional.category?.name}</span>
          <span>by {proName}</span>
          {offer.professional.phone && <span>📞 {offer.professional.phone}</span>}
          {startAt && expiresAt && (
            <span className={isExpiredWindow ? "text-red-400 line-through" : ""}>
              {fmt(startAt)} → {fmt(expiresAt)}
            </span>
          )}
          {isExpiredWindow && <span className="text-red-400 font-medium">Window expired — ask for resubmission</span>}
          {offer.adminNote && offer.status !== "PENDING" && (
            <span className="text-red-400 italic">{offer.adminNote}</span>
          )}
        </div>

        {showActions && (
          <div className="mt-3 flex flex-wrap gap-2">
            {!showRejectForm ? (
              <>
                <Button
                  size="sm"
                  disabled={!!loading}
                  onClick={async () => {
                    setLoading("approve");
                    try { await approveOffer(offer.id); setDone(true); }
                    catch (e) { alert(e instanceof Error ? e.message : "Error"); }
                    finally { setLoading(null); }
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white h-8 text-xs"
                >
                  <CheckCircle className="h-3.5 w-3.5 mr-1" />
                  {loading === "approve" ? "Approving…" : "Approve"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!!loading}
                  onClick={() => setShowRejectForm(true)}
                  className="h-8 text-xs border-red-200 text-red-600 hover:bg-red-50"
                >
                  <XCircle className="h-3.5 w-3.5 mr-1" />
                  Reject
                </Button>
              </>
            ) : (
              <div className="flex gap-2 items-start w-full flex-wrap">
                <input
                  type="text"
                  placeholder="Reason for rejection…"
                  value={rejectNote}
                  onChange={(e) => setRejectNote(e.target.value)}
                  className="flex-1 min-w-40 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-400"
                />
                <Button
                  size="sm"
                  disabled={!rejectNote.trim() || !!loading}
                  onClick={async () => {
                    setLoading("reject");
                    try { await rejectOffer(offer.id, rejectNote); setDone(true); }
                    catch (e) { alert(e instanceof Error ? e.message : "Error"); }
                    finally { setLoading(null); }
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white h-8 text-xs"
                >
                  {loading === "reject" ? "Rejecting…" : "Confirm reject"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowRejectForm(false)} className="h-8 text-xs">
                  Cancel
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function OffersAdminPanel({ pending, active, recent }: Props) {
  return (
    <div className="space-y-8">
      {/* Pending */}
      <section>
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3">
          Pending Review ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-800 py-10 text-center">
            <Megaphone className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No pending offers</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map((o) => <OfferRow key={o.id} offer={o} showActions />)}
          </div>
        )}
      </section>

      {/* Active */}
      {active.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3">
            Active ({active.length})
          </h2>
          <div className="space-y-3">
            {active.map((o) => <OfferRow key={o.id} offer={o} showActions={false} />)}
          </div>
        </section>
      )}

      {/* Recent closed */}
      {recent.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3">
            Recent Closed
          </h2>
          <div className="space-y-3">
            {recent.map((o) => <OfferRow key={o.id} offer={o} showActions={false} />)}
          </div>
        </section>
      )}
    </div>
  );
}
