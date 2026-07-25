"use client";

import { useState } from "react";
import { Sparkles, CheckCircle, XCircle, Clock, Users, DollarSign, Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CategoryIcon } from "@/components/ui/category-icon";
import {
  approveSponsoredListing,
  rejectSponsoredListing,
  cancelSponsoredListingAdmin,
  createPricingTier,
  updatePricingTier,
} from "@/lib/actions/sponsored";

type SponsoredListing = {
  id: string;
  status: string;
  priceMonthly: number | string;
  startDate: Date | null;
  createdAt: Date;
  adminNote: string | null;
  professional: {
    id: string;
    businessName: string | null;
    user: { firstName: string | null; lastName: string | null; displayName: string | null; email: string };
  };
  category: { id: string; name: string; slug: string; icon: string | null };
  serviceArea: { id: string; name: string };
  pricingTier: { id: string; name: string; priceMonthly: number | string } | null;
};

type WaitlistEntry = {
  id: string;
  createdAt: Date;
  notifiedAt: Date | null;
  professional: {
    id: string;
    user: { firstName: string | null; lastName: string | null; displayName: string | null; email: string };
  };
  category: { id: string; name: string; slug: string; icon: string | null };
  serviceArea: { id: string; name: string };
};

type PricingTier = {
  id: string;
  name: string;
  priceMonthly: number | string;
  maxSlots: number;
  isActive: boolean;
  createdAt: Date;
  category: { id: string; name: string } | null;
  serviceArea: { id: string; name: string } | null;
};

interface Props {
  pending: SponsoredListing[];
  active: SponsoredListing[];
  waitlist: WaitlistEntry[];
  tiers: PricingTier[];
}

function profName(u: SponsoredListing["professional"]["user"]) {
  return u.displayName ?? [u.firstName, u.lastName].filter(Boolean).join(" ") ?? u.email;
}

export function SponsoredManagement({ pending, active, waitlist, tiers }: Props) {
  const [tab, setTab] = useState<"pending" | "active" | "waitlist" | "pricing">("pending");
  const [loading, setLoading] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [cancelNote, setCancelNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Pricing tier form
  const [showTierForm, setShowTierForm] = useState(false);
  const [editTierId, setEditTierId] = useState<string | null>(null);
  const [tierName, setTierName] = useState("");
  const [tierPrice, setTierPrice] = useState("49");
  const [tierSlots, setTierSlots] = useState("2");

  async function handleApprove(id: string) {
    setLoading(id + "-approve");
    setError(null);
    try {
      await approveSponsoredListing(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to approve");
    }
    setLoading(null);
  }

  async function handleReject(id: string) {
    if (!rejectNote.trim()) return;
    setLoading(id + "-reject");
    await rejectSponsoredListing(id, rejectNote);
    setRejectId(null);
    setRejectNote("");
    setLoading(null);
  }

  async function handleCancel(id: string) {
    setLoading(id + "-cancel");
    await cancelSponsoredListingAdmin(id, cancelNote || undefined);
    setCancelId(null);
    setCancelNote("");
    setLoading(null);
  }

  async function handleSaveTier() {
    setLoading("tier");
    try {
      if (editTierId) {
        await updatePricingTier(editTierId, {
          name: tierName,
          priceMonthly: parseFloat(tierPrice),
          maxSlots: parseInt(tierSlots),
        });
      } else {
        await createPricingTier({
          name: tierName,
          priceMonthly: parseFloat(tierPrice),
          maxSlots: parseInt(tierSlots),
        });
      }
      setShowTierForm(false);
      setEditTierId(null);
      setTierName("");
      setTierPrice("49");
      setTierSlots("2");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save tier");
    }
    setLoading(null);
  }

  async function handleToggleTierActive(id: string, isActive: boolean) {
    setLoading(id + "-toggle");
    await updatePricingTier(id, { isActive: !isActive });
    setLoading(null);
  }

  const TABS = [
    { key: "pending" as const, label: "Pending", count: pending.length },
    { key: "active" as const, label: "Active", count: active.length },
    { key: "waitlist" as const, label: "Waitlist", count: waitlist.length },
    { key: "pricing" as const, label: "Pricing", count: tiers.length },
  ];

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
          <button onClick={() => setError(null)} className="ml-3 underline">Dismiss</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-800 pb-px overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              tab === t.key
                ? "border-violet-600 text-violet-700 dark:text-violet-400"
                : "border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
            }`}
          >
            {t.label}
            {t.count > 0 && (
              <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs px-1.5 py-0.5 rounded-full">
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Pending */}
      {tab === "pending" && (
        <div className="space-y-4">
          {pending.length === 0 && (
            <EmptyState icon={<Clock className="h-8 w-8" />} text="No pending applications" />
          )}
          {pending.map((l) => (
            <ListingCard key={l.id} listing={l}>
              <div className="flex flex-wrap gap-2 mt-3">
                <Button
                  size="sm"
                  onClick={() => handleApprove(l.id)}
                  disabled={!!loading}
                  className="bg-green-600 hover:bg-green-700 text-white gap-1.5"
                >
                  <CheckCircle className="h-3.5 w-3.5" /> Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setRejectId(l.id)}
                  disabled={!!loading}
                  className="border-red-200 text-red-700 hover:bg-red-50 gap-1.5"
                >
                  <XCircle className="h-3.5 w-3.5" /> Reject
                </Button>
              </div>

              {rejectId === l.id && (
                <div className="mt-3 border-t border-gray-100 dark:border-gray-800 pt-3">
                  <textarea
                    value={rejectNote}
                    onChange={(e) => setRejectNote(e.target.value)}
                    placeholder="Reason for rejection (sent to professional)…"
                    rows={2}
                    className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 resize-none focus:outline-none focus:ring-2 focus:ring-red-400"
                  />
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" onClick={() => handleReject(l.id)} disabled={!rejectNote.trim() || !!loading} className="bg-red-600 hover:bg-red-700 text-white">
                      Confirm Rejection
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => { setRejectId(null); setRejectNote(""); }}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </ListingCard>
          ))}
        </div>
      )}

      {/* Active */}
      {tab === "active" && (
        <div className="space-y-4">
          {active.length === 0 && (
            <EmptyState icon={<Sparkles className="h-8 w-8" />} text="No active sponsored listings" />
          )}
          {active.map((l) => (
            <ListingCard key={l.id} listing={l} showStartDate>
              <div className="flex flex-wrap gap-2 mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCancelId(l.id)}
                  disabled={!!loading}
                  className="border-red-200 text-red-700 hover:bg-red-50 gap-1.5"
                >
                  <XCircle className="h-3.5 w-3.5" /> Cancel Listing
                </Button>
              </div>

              {cancelId === l.id && (
                <div className="mt-3 border-t border-gray-100 dark:border-gray-800 pt-3">
                  <textarea
                    value={cancelNote}
                    onChange={(e) => setCancelNote(e.target.value)}
                    placeholder="Optional note for cancellation…"
                    rows={2}
                    className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 resize-none focus:outline-none focus:ring-2 focus:ring-red-400"
                  />
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" onClick={() => handleCancel(l.id)} disabled={!!loading} className="bg-red-600 hover:bg-red-700 text-white">
                      Confirm Cancellation
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => { setCancelId(null); setCancelNote(""); }}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </ListingCard>
          ))}
        </div>
      )}

      {/* Waitlist */}
      {tab === "waitlist" && (
        <div className="space-y-3">
          {waitlist.length === 0 && (
            <EmptyState icon={<Users className="h-8 w-8" />} text="No businesses on the waitlist" />
          )}
          {waitlist.map((w) => (
            <div key={w.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white text-sm">{profName(w.professional.user)}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{w.professional.user.email}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full text-gray-600 dark:text-gray-400">
                      <CategoryIcon slug={w.category.slug} className="inline h-3.5 w-3.5 mr-1 -mt-0.5" />{w.category.name}
                    </span>
                    <span className="text-xs text-gray-400">·</span>
                    <span className="text-xs text-gray-500">{w.serviceArea.name}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Joined waitlist {new Date(w.createdAt).toLocaleDateString("en-CA", { month: "short", day: "numeric" })}
                    {w.notifiedAt && ` · Notified ${new Date(w.notifiedAt).toLocaleDateString("en-CA", { month: "short", day: "numeric" })}`}
                  </p>
                </div>
                {w.notifiedAt && (
                  <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex-shrink-0">
                    Notified
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pricing */}
      {tab === "pricing" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Pricing tiers are matched from most specific (category + area) to most general (default). The default tier applies when no specific tier matches.
            </p>
            <Button
              size="sm"
              onClick={() => { setShowTierForm(true); setEditTierId(null); setTierName(""); setTierPrice("49"); setTierSlots("2"); }}
              className="bg-violet-600 hover:bg-violet-700 text-white gap-1.5 flex-shrink-0"
            >
              <Plus className="h-3.5 w-3.5" /> New Tier
            </Button>
          </div>

          {showTierForm && (
            <div className="bg-violet-50 dark:bg-violet-900/10 border border-violet-200 dark:border-violet-800/50 rounded-xl p-4 space-y-3">
              <h4 className="font-semibold text-violet-900 dark:text-violet-300 text-sm">{editTierId ? "Edit Tier" : "New Pricing Tier"}</h4>
              <div className="grid sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Name</label>
                  <input
                    value={tierName}
                    onChange={(e) => setTierName(e.target.value)}
                    placeholder="e.g. Default, GTA Premium"
                    className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Price / month (CAD)</label>
                  <input
                    value={tierPrice}
                    onChange={(e) => setTierPrice(e.target.value)}
                    type="number"
                    min="0"
                    step="1"
                    className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Max slots</label>
                  <input
                    value={tierSlots}
                    onChange={(e) => setTierSlots(e.target.value)}
                    type="number"
                    min="1"
                    max="10"
                    className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-400"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveTier} disabled={!tierName.trim() || !!loading} className="bg-violet-600 hover:bg-violet-700 text-white">
                  {editTierId ? "Save Changes" : "Create Tier"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setShowTierForm(false); setEditTierId(null); }}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {tiers.length === 0 && (
              <EmptyState icon={<DollarSign className="h-8 w-8" />} text="No pricing tiers yet — create one to get started" />
            )}
            {tiers.map((t) => (
              <div key={t.id} className={`bg-white dark:bg-gray-900 border rounded-xl p-4 ${t.isActive ? "border-gray-200 dark:border-gray-800" : "border-gray-100 dark:border-gray-900 opacity-60"}`}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 dark:text-white text-sm">{t.name}</p>
                      {!t.isActive && <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">Inactive</span>}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      <span className="font-semibold text-violet-700 dark:text-violet-400">${Number(t.priceMonthly).toFixed(0)} CAD/month</span>
                      {" · "}{t.maxSlots} slot{t.maxSlots !== 1 ? "s" : ""}
                      {t.category && ` · ${t.category.name}`}
                      {t.serviceArea && ` · ${t.serviceArea.name}`}
                      {!t.category && !t.serviceArea && " · Default (all categories + areas)"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditTierId(t.id);
                        setTierName(t.name);
                        setTierPrice(String(Number(t.priceMonthly)));
                        setTierSlots(String(t.maxSlots));
                        setShowTierForm(true);
                      }}
                      className="text-gray-400 hover:text-violet-700 transition-colors"
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleToggleTierActive(t.id, t.isActive)}
                      disabled={!!loading}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                        t.isActive
                          ? "bg-green-50 text-green-700 border-green-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200"
                          : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-green-50 hover:text-green-700 hover:border-green-200"
                      }`}
                    >
                      {t.isActive ? "Active" : "Inactive"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ListingCard({ listing, children, showStartDate }: {
  listing: SponsoredListing;
  children: React.ReactNode;
  showStartDate?: boolean;
}) {
  const name = profName(listing.professional.user);
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-gray-900 dark:text-white">{name}</p>
            {listing.professional.businessName && (
              <span className="text-xs text-gray-400">{listing.professional.businessName}</span>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">{listing.professional.user.email}</p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full text-gray-600 dark:text-gray-400">
              <CategoryIcon slug={listing.category.slug} className="inline h-3.5 w-3.5 mr-1 -mt-0.5" />{listing.category.name}
            </span>
            <span className="text-xs text-gray-400">·</span>
            <span className="text-xs text-gray-500">{listing.serviceArea.name}</span>
            <span className="text-xs text-gray-400">·</span>
            <span className="text-xs font-semibold text-violet-700 dark:text-violet-400">
              ${Number(listing.priceMonthly).toFixed(0)}/mo
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Applied {new Date(listing.createdAt).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" })}
            {showStartDate && listing.startDate && ` · Active since ${new Date(listing.startDate).toLocaleDateString("en-CA", { month: "short", day: "numeric" })}`}
          </p>
          {listing.adminNote && (
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">Note: {listing.adminNote}</p>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="text-center py-14 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl">
      <div className="flex justify-center mb-3 text-gray-300 dark:text-gray-600">{icon}</div>
      <p className="text-sm text-gray-400 dark:text-gray-500">{text}</p>
    </div>
  );
}
