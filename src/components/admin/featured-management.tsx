"use client";

import { useState } from "react";
import { Star, CheckCircle, XCircle, Clock, Users, DollarSign, Plus, Pencil, MapPin, Eye, MousePointer } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  approveFeaturedListing,
  rejectFeaturedListing,
  cancelFeaturedListingAdmin,
  createFeaturedPricingTier,
  updateFeaturedPricingTier,
} from "@/lib/actions/featured";

type FeaturedListing = {
  id: string;
  city: string;
  status: string;
  priceMonthly: number | string;
  startDate: Date | null;
  createdAt: Date;
  adminNote: string | null;
  impressions: number;
  cardClicks: number;
  professional: {
    id: string;
    businessName: string | null;
    user: { firstName: string | null; lastName: string | null; displayName: string | null; email: string };
    category: { name: string; icon: string | null };
  };
  pricingTier: { name: string; priceMonthly: number | string } | null;
};

type WaitlistEntry = {
  id: string;
  city: string;
  createdAt: Date;
  notifiedAt: Date | null;
  professional: {
    id: string;
    user: { firstName: string | null; lastName: string | null; displayName: string | null; email: string };
  };
};

type PricingTier = {
  id: string;
  name: string;
  city: string | null;
  priceMonthly: number | string;
  maxSlots: number;
  isActive: boolean;
  createdAt: Date;
};

interface Props {
  pending: FeaturedListing[];
  active: FeaturedListing[];
  waitlist: WaitlistEntry[];
  tiers: PricingTier[];
}

function profName(u: FeaturedListing["professional"]["user"]) {
  return u.displayName ?? [u.firstName, u.lastName].filter(Boolean).join(" ") ?? u.email;
}

export function FeaturedManagement({ pending, active, waitlist, tiers }: Props) {
  const [tab, setTab] = useState<"pending" | "active" | "waitlist" | "pricing">("pending");
  const [loading, setLoading] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [cancelNote, setCancelNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showTierForm, setShowTierForm] = useState(false);
  const [editTierId, setEditTierId] = useState<string | null>(null);
  const [tierName, setTierName] = useState("");
  const [tierCity, setTierCity] = useState("");
  const [tierPrice, setTierPrice] = useState("99");
  const [tierSlots, setTierSlots] = useState("6");

  async function handleApprove(id: string) {
    setLoading(id + "-approve"); setError(null);
    try { await approveFeaturedListing(id); } catch (e) { setError(e instanceof Error ? e.message : "Failed"); }
    setLoading(null);
  }

  async function handleReject(id: string) {
    if (!rejectNote.trim()) return;
    setLoading(id + "-reject");
    await rejectFeaturedListing(id, rejectNote);
    setRejectId(null); setRejectNote(""); setLoading(null);
  }

  async function handleCancel(id: string) {
    setLoading(id + "-cancel");
    await cancelFeaturedListingAdmin(id, cancelNote || undefined);
    setCancelId(null); setCancelNote(""); setLoading(null);
  }

  async function handleSaveTier() {
    setLoading("tier");
    try {
      if (editTierId) {
        await updateFeaturedPricingTier(editTierId, { name: tierName, priceMonthly: parseFloat(tierPrice), maxSlots: parseInt(tierSlots) });
      } else {
        await createFeaturedPricingTier({ name: tierName, city: tierCity || null, priceMonthly: parseFloat(tierPrice), maxSlots: parseInt(tierSlots) });
      }
      setShowTierForm(false); setEditTierId(null); setTierName(""); setTierCity(""); setTierPrice("99"); setTierSlots("6");
    } catch (e) { setError(e instanceof Error ? e.message : "Failed to save"); }
    setLoading(null);
  }

  async function handleToggleTier(id: string, isActive: boolean) {
    setLoading(id + "-toggle");
    await updateFeaturedPricingTier(id, { isActive: !isActive });
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
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center justify-between">
          {error}
          <button onClick={() => setError(null)} className="underline text-xs">Dismiss</button>
        </div>
      )}

      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-800 pb-px overflow-x-auto">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px whitespace-nowrap flex items-center gap-1.5 transition-colors ${
              tab === t.key ? "border-amber-600 text-amber-700 dark:text-amber-400" : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            {t.label}
            {t.count > 0 && <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 text-xs px-1.5 py-0.5 rounded-full">{t.count}</span>}
          </button>
        ))}
      </div>

      {/* Pending */}
      {tab === "pending" && (
        <div className="space-y-4">
          {pending.length === 0 && <Empty icon={<Clock className="h-8 w-8" />} text="No pending applications" />}
          {pending.map((l) => (
            <ListingCard key={l.id} l={l}>
              <div className="flex flex-wrap gap-2 mt-3">
                <Button size="sm" onClick={() => handleApprove(l.id)} disabled={!!loading} className="bg-green-600 hover:bg-green-700 text-white gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5" /> Approve
                </Button>
                <Button size="sm" variant="outline" onClick={() => setRejectId(l.id)} disabled={!!loading} className="border-red-200 text-red-700 hover:bg-red-50 gap-1.5">
                  <XCircle className="h-3.5 w-3.5" /> Reject
                </Button>
              </div>
              {rejectId === l.id && (
                <div className="mt-3 border-t border-gray-100 dark:border-gray-800 pt-3">
                  <textarea value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} placeholder="Reason for rejection…" rows={2}
                    className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 resize-none focus:outline-none focus:ring-2 focus:ring-red-400" />
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" onClick={() => handleReject(l.id)} disabled={!rejectNote.trim() || !!loading} className="bg-red-600 hover:bg-red-700 text-white">Confirm</Button>
                    <Button size="sm" variant="ghost" onClick={() => { setRejectId(null); setRejectNote(""); }}>Cancel</Button>
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
          {active.length === 0 && <Empty icon={<Star className="h-8 w-8" />} text="No active featured businesses" />}
          {active.map((l) => (
            <ListingCard key={l.id} l={l} showAnalytics showStartDate>
              <div className="flex flex-wrap gap-2 mt-3">
                <Button size="sm" variant="outline" onClick={() => setCancelId(l.id)} disabled={!!loading} className="border-red-200 text-red-700 hover:bg-red-50 gap-1.5">
                  <XCircle className="h-3.5 w-3.5" /> Cancel Listing
                </Button>
              </div>
              {cancelId === l.id && (
                <div className="mt-3 border-t border-gray-100 dark:border-gray-800 pt-3">
                  <textarea value={cancelNote} onChange={(e) => setCancelNote(e.target.value)} placeholder="Optional note…" rows={2}
                    className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 resize-none focus:outline-none focus:ring-2 focus:ring-red-400" />
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" onClick={() => handleCancel(l.id)} disabled={!!loading} className="bg-red-600 hover:bg-red-700 text-white">Confirm Cancellation</Button>
                    <Button size="sm" variant="ghost" onClick={() => { setCancelId(null); setCancelNote(""); }}>Cancel</Button>
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
          {waitlist.length === 0 && <Empty icon={<Users className="h-8 w-8" />} text="No businesses on the waitlist" />}
          {waitlist.map((w) => (
            <div key={w.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-gray-900 dark:text-white text-sm">{profName(w.professional.user)}</p>
                <p className="text-xs text-gray-500 mt-0.5">{w.professional.user.email}</p>
                <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-400">
                  <MapPin className="h-3 w-3" /> {w.city}
                  <span>·</span>
                  <span>Joined {new Date(w.createdAt).toLocaleDateString("en-CA", { month: "short", day: "numeric" })}</span>
                </div>
              </div>
              {w.notifiedAt && (
                <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex-shrink-0">Notified</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pricing */}
      {tab === "pricing" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400">City-specific tiers override the default. Default tier applies to all cities without a specific tier.</p>
            <Button size="sm" onClick={() => { setShowTierForm(true); setEditTierId(null); setTierName(""); setTierCity(""); setTierPrice("99"); setTierSlots("6"); }}
              className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5 flex-shrink-0">
              <Plus className="h-3.5 w-3.5" /> New Tier
            </Button>
          </div>

          {showTierForm && (
            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50 rounded-xl p-4 space-y-3">
              <h4 className="font-semibold text-amber-900 dark:text-amber-300 text-sm">{editTierId ? "Edit Tier" : "New Pricing Tier"}</h4>
              <div className="grid sm:grid-cols-4 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Name</label>
                  <input value={tierName} onChange={(e) => setTierName(e.target.value)} placeholder="e.g. Default, Toronto Premium"
                    className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">City (blank = default)</label>
                  <input value={tierCity} onChange={(e) => setTierCity(e.target.value)} placeholder="e.g. Toronto"
                    className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Price CAD/mo</label>
                  <input value={tierPrice} onChange={(e) => setTierPrice(e.target.value)} type="number" min="0"
                    className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Max slots</label>
                  <input value={tierSlots} onChange={(e) => setTierSlots(e.target.value)} type="number" min="1" max="20"
                    className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveTier} disabled={!tierName.trim() || !!loading} className="bg-amber-600 hover:bg-amber-700 text-white">
                  {editTierId ? "Save Changes" : "Create Tier"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setShowTierForm(false); setEditTierId(null); }}>Cancel</Button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {tiers.length === 0 && <Empty icon={<DollarSign className="h-8 w-8" />} text="No pricing tiers yet" />}
            {tiers.map((t) => (
              <div key={t.id} className={`bg-white dark:bg-gray-900 border rounded-xl p-4 ${t.isActive ? "border-gray-200 dark:border-gray-800" : "border-gray-100 opacity-60"}`}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 dark:text-white text-sm">{t.name}</p>
                      {!t.isActive && <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">Inactive</span>}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      <span className="font-semibold text-amber-700 dark:text-amber-400">${Number(t.priceMonthly).toFixed(0)} CAD/month</span>
                      {" · "}{t.maxSlots} slots per city
                      {t.city ? ` · ${t.city} only` : " · All cities (default)"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => { setEditTierId(t.id); setTierName(t.name); setTierCity(t.city ?? ""); setTierPrice(String(Number(t.priceMonthly))); setTierSlots(String(t.maxSlots)); setShowTierForm(true); }}
                      className="text-gray-400 hover:text-amber-700 transition-colors">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleToggleTier(t.id, t.isActive)} disabled={!!loading}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-all ${t.isActive ? "bg-green-50 text-green-700 border-green-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200" : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-green-50 hover:text-green-700 hover:border-green-200"}`}>
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

function ListingCard({ l, children, showStartDate, showAnalytics }: {
  l: FeaturedListing;
  children: React.ReactNode;
  showStartDate?: boolean;
  showAnalytics?: boolean;
}) {
  const name = profName(l.professional.user);
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-gray-900 dark:text-white">{name}</p>
            {l.professional.businessName && <span className="text-xs text-gray-400">{l.professional.businessName}</span>}
          </div>
          <p className="text-xs text-gray-500">{l.professional.user.email}</p>
          <div className="flex items-center gap-2 mt-1.5 text-xs flex-wrap">
            <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full">
              {l.professional.category.icon} {l.professional.category.name}
            </span>
            <span className="flex items-center gap-1 text-gray-400"><MapPin className="h-3 w-3" />{l.city}</span>
            <span className="font-semibold text-amber-700 dark:text-amber-400">${Number(l.priceMonthly).toFixed(0)}/mo</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Applied {new Date(l.createdAt).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" })}
            {showStartDate && l.startDate && ` · Active since ${new Date(l.startDate).toLocaleDateString("en-CA", { month: "short", day: "numeric" })}`}
          </p>
          {showAnalytics && (
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
              <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{l.impressions} impressions</span>
              <span className="flex items-center gap-1"><MousePointer className="h-3 w-3" />{l.cardClicks} clicks</span>
            </div>
          )}
          {l.adminNote && <p className="text-xs text-amber-700 mt-1">Note: {l.adminNote}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

function Empty({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="text-center py-14 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl">
      <div className="flex justify-center mb-3 text-gray-300 dark:text-gray-600">{icon}</div>
      <p className="text-sm text-gray-400">{text}</p>
    </div>
  );
}
