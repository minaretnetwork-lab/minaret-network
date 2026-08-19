"use client";

import { useState } from "react";
import { Star, CheckCircle, Clock, XCircle, Info, ArrowRight, Eye, MousePointer, Globe, Phone, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { applyForFeatured, cancelMyFeaturedListing, leaveFeaturedWaitlist } from "@/lib/actions/featured";
import { REGION_MAP } from "@/lib/constants";

type ServiceArea = { id: string; name: string; slug: string };

type FeaturedListing = {
  id: string;
  city: string;
  region: string | null;
  status: string;
  priceMonthly: number | string;
  startDate: Date | null;
  createdAt: Date;
  adminNote: string | null;
  impressions: number;
  cardClicks: number;
  websiteClicks: number;
  phoneClicks: number;
  whatsappClicks: number;
};

type WaitlistEntry = {
  id: string;
  city: string;
  createdAt: Date;
  notifiedAt: Date | null;
};

type Professional = {
  id: string;
  status: string;
  isFeatured: boolean;
  serviceAreas: ServiceArea[];
  mosque: { city: string | null } | null;
};

interface Props {
  listings: FeaturedListing[];
  waitlist: WaitlistEntry[];
  professional: Professional;
}

const STATUS_UI: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  PENDING:  { label: "Pending Review", color: "text-amber-700 bg-amber-50 border-amber-200", icon: <Clock className="h-3.5 w-3.5" /> },
  ACTIVE:   { label: "Active",         color: "text-green-700 bg-green-50 border-green-200", icon: <CheckCircle className="h-3.5 w-3.5" /> },
  REJECTED: { label: "Rejected",       color: "text-red-700 bg-red-50 border-red-200",       icon: <XCircle className="h-3.5 w-3.5" /> },
};

export function FeaturedBusinessDashboard({ listings, waitlist, professional }: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedArea, setSelectedArea] = useState<string>(professional.serviceAreas[0]?.id ?? "");

  const selectedAreaObj = professional.serviceAreas.find((a) => a.id === selectedArea);
  const selectedRegion = selectedAreaObj ? (REGION_MAP[selectedAreaObj.slug] ?? "Beyond GTA") : null;

  const isApproved = professional.status === "APPROVED";
  const hasActiveOrPendingInRegion = selectedRegion
    ? listings.some((l) => (l.region ?? l.city) === selectedRegion && (l.status === "ACTIVE" || l.status === "PENDING"))
    : false;

  async function handleApply() {
    if (!selectedArea) { setError("Please select a service area first"); return; }
    setLoading("apply"); setError(null); setSuccess(null);
    try {
      const result = await applyForFeatured(selectedArea);
      setSuccess(result.status === "waitlisted"
        ? `All 6 ${result.region} slots are currently taken — you've been added to the waitlist. We'll notify you when a slot opens.`
        : `Application submitted for ${result.region}! An admin will review it shortly.`);
    } catch (e) { setError(e instanceof Error ? e.message : "Something went wrong"); }
    setLoading(null);
  }

  async function handleCancel(id: string) {
    setLoading("cancel-" + id); setError(null);
    try { await cancelMyFeaturedListing(id); }
    catch (e) { setError(e instanceof Error ? e.message : "Failed to cancel"); }
    setLoading(null);
  }

  async function handleLeaveWaitlist(region: string) {
    setLoading("wl-" + region);
    await leaveFeaturedWaitlist(region);
    setLoading(null);
  }

  return (
    <div className="space-y-8">

      {/* What is Featured */}
      <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <Star className="h-5 w-5 text-amber-600 fill-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-amber-900 dark:text-amber-200">Featured Business</h3>
            <p className="text-sm text-amber-800/80 dark:text-amber-300/80 mt-1 leading-relaxed">
              Featured businesses appear on the Minaret Network homepage in a dedicated &ldquo;Featured Businesses&rdquo; section. Each GTA region has up to 6 Featured Business slots — only businesses serving that region compete for those spots.
            </p>
            <div className="flex flex-wrap gap-4 mt-3 text-sm font-medium text-amber-900 dark:text-amber-200">
              <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-amber-600" /> Homepage placement</span>
              <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-amber-600" /> Featured badge on your card</span>
              <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-amber-600" /> Impression & click analytics</span>
            </div>
          </div>
        </div>
      </div>

      {/* Apply */}
      {isApproved && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 space-y-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">Apply for Featured Status</h3>

          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Info className="h-4 w-4 flex-shrink-0" />
            <span>
              <span className="font-semibold text-emerald-700 dark:text-emerald-400">Free until Oct 31, 2026</span>
              {" · "}$29.99 CAD/month from Nov 1, 2026 · Max 6 businesses per GTA region
            </span>
          </div>

          {professional.serviceAreas.length === 0 ? (
            <p className="text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-3 py-2">
              Add a service area to your profile before applying.
            </p>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                  Service area
                </label>
                <select
                  value={selectedArea}
                  onChange={(e) => setSelectedArea(e.target.value)}
                  className="w-full sm:w-72 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {professional.serviceAreas.map((a) => {
                    const region = REGION_MAP[a.slug] ?? "Beyond GTA";
                    return (
                      <option key={a.id} value={a.id}>
                        {a.name} — {region} region
                      </option>
                    );
                  })}
                </select>
                {selectedRegion && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Competing for a slot in the <strong className="text-gray-600 dark:text-gray-300">{selectedRegion}</strong> region
                  </p>
                )}
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}
              {success && <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">{success}</p>}

              <Button onClick={handleApply} disabled={!!loading || hasActiveOrPendingInRegion || !selectedArea}
                className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5">
                <Star className="h-4 w-4 fill-white" />
                {hasActiveOrPendingInRegion
                  ? `Already applied for ${selectedRegion}`
                  : selectedRegion
                    ? `Apply — ${selectedRegion} region`
                    : "Apply for Featured Business"}
                {!hasActiveOrPendingInRegion && <ArrowRight className="h-4 w-4" />}
              </Button>
              {hasActiveOrPendingInRegion && (
                <p className="text-xs text-gray-400">Cancel your current listing in this region to reapply.</p>
              )}
            </div>
          )}
        </div>
      )}

      {!isApproved && (
        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50 rounded-xl p-4 text-sm text-amber-700 dark:text-amber-300">
          Your profile must be approved before applying for a Featured listing.
        </div>
      )}

      {/* Current listings */}
      {listings.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900 dark:text-white">Your Featured Applications</h3>
          {listings.map((l) => {
            const ui = STATUS_UI[l.status] ?? STATUS_UI.PENDING;
            const price = Number(l.priceMonthly);
            const displayRegion = l.region ?? l.city;
            return (
              <div key={l.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${ui.color}`}>
                        {ui.icon} {ui.label}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Featured Business — {displayRegion} region</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {new Date() < new Date("2026-11-01T00:00:00.000Z") ? "Free (launch offer)" : `$${price.toFixed(2)} CAD/month`}
                      {l.startDate && ` · Active since ${new Date(l.startDate).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" })}`}
                    </p>
                    {l.adminNote && l.status === "REJECTED" && (
                      <p className="text-xs text-red-700 mt-1">Reason: {l.adminNote}</p>
                    )}

                    {l.status === "ACTIVE" && (
                      <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                        <AnalyticPill icon={<Eye className="h-3 w-3" />} label="Impressions" value={l.impressions} />
                        <AnalyticPill icon={<MousePointer className="h-3 w-3" />} label="Card Clicks" value={l.cardClicks} />
                        <AnalyticPill icon={<Globe className="h-3 w-3" />} label="Website" value={l.websiteClicks} />
                        <AnalyticPill icon={<Phone className="h-3 w-3" />} label="Phone" value={l.phoneClicks} />
                        <AnalyticPill icon={<MessageCircle className="h-3 w-3" />} label="WhatsApp" value={l.whatsappClicks} />
                      </div>
                    )}
                  </div>

                  {(l.status === "ACTIVE" || l.status === "PENDING") && (
                    <button onClick={() => handleCancel(l.id)} disabled={!!loading}
                      className="text-xs text-gray-400 hover:text-red-600 transition-colors underline flex-shrink-0">
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Waitlist */}
      {waitlist.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900 dark:text-white">Waitlist</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 -mt-2">You&apos;ll be notified when a slot opens in your region.</p>
          {waitlist.map((w) => (
            <div key={w.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Featured Business — {w.city} region — Waitlisted</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  On waitlist since {new Date(w.createdAt).toLocaleDateString("en-CA", { month: "short", day: "numeric" })}
                  {w.notifiedAt && " · Slot available — apply now!"}
                </p>
              </div>
              <button onClick={() => handleLeaveWaitlist(w.city)} disabled={!!loading}
                className="text-xs text-gray-400 hover:text-red-600 transition-colors underline flex-shrink-0">
                Leave
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AnalyticPill({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-gray-500">
      <span className="text-gray-400">{icon}</span>
      <span className="font-semibold text-gray-900 dark:text-white">{value}</span>
      <span>{label}</span>
    </div>
  );
}
