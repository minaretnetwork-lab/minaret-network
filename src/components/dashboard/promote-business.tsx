"use client";

import { useState } from "react";
import { Sparkles, CheckCircle, Clock, XCircle, Info, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { applyForSponsorship, cancelMySponsorship, removeFromWaitlist } from "@/lib/actions/sponsored";

type ServiceArea = { id: string; name: string };
type Category = { id: string; name: string; icon: string | null };

type Listing = {
  id: string;
  status: string;
  priceMonthly: number | string;
  startDate: Date | null;
  createdAt: Date;
  adminNote: string | null;
  category: Category;
  serviceArea: ServiceArea;
};

type WaitlistEntry = {
  id: string;
  createdAt: Date;
  notifiedAt: Date | null;
  category: Category;
  serviceArea: ServiceArea;
};

type Professional = {
  id: string;
  status: string;
  isSponsored: boolean;
  searchAppearances: number;
  contactClicks: number;
  profileViews: number;
  category: Category;
  serviceAreas: ServiceArea[];
};

interface Props {
  listings: Listing[];
  waitlist: WaitlistEntry[];
  professional: Professional;
}

const STATUS_UI: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  PENDING: {
    label: "Pending Admin Review",
    color: "text-amber-700 bg-amber-50 border-amber-200",
    icon: <Clock className="h-3.5 w-3.5" />,
  },
  ACTIVE: {
    label: "Active",
    color: "text-green-700 bg-green-50 border-green-200",
    icon: <CheckCircle className="h-3.5 w-3.5" />,
  },
  REJECTED: {
    label: "Rejected",
    color: "text-red-700 bg-red-50 border-red-200",
    icon: <XCircle className="h-3.5 w-3.5" />,
  },
};

export function PromoteBusiness({ listings, waitlist, professional }: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedArea, setSelectedArea] = useState<string>(professional.serviceAreas[0]?.id ?? "");

  const isApproved = professional.status === "APPROVED";
  const categoryId = professional.category.id;

  async function handleApply() {
    if (!selectedArea) return;
    setLoading("apply");
    setError(null);
    setSuccess(null);
    try {
      const result = await applyForSponsorship(categoryId, selectedArea);
      if (result.status === "waitlisted") {
        setSuccess(`Slots are full — you've been added to the waitlist. We'll notify you when a slot opens.`);
      } else {
        setSuccess("Application submitted! An admin will review it shortly.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    }
    setLoading(null);
  }

  async function handleCancel(listingId: string) {
    setLoading("cancel-" + listingId);
    setError(null);
    try {
      await cancelMySponsorship(listingId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to cancel");
    }
    setLoading(null);
  }

  async function handleLeaveWaitlist(cat: string, area: string) {
    setLoading("wl-" + cat + area);
    await removeFromWaitlist(cat, area);
    setLoading(null);
  }

  const selectedAreaName = professional.serviceAreas.find((a) => a.id === selectedArea)?.name ?? "";
  const hasActiveOrPending = listings.some((l) => l.status === "ACTIVE" || l.status === "PENDING");

  return (
    <div className="space-y-8">
      {/* Analytics strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <StatBox label="Profile Views" value={professional.profileViews} />
        <StatBox label="Search Appearances" value={professional.searchAppearances} />
        <StatBox label="Contact Clicks" value={professional.contactClicks} />
      </div>

      {/* What is a sponsored listing */}
      <div className="bg-violet-50 dark:bg-violet-900/10 border border-violet-200 dark:border-violet-800/50 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-violet-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-violet-900 dark:text-violet-200">Sponsored Listings</h3>
            <p className="text-sm text-violet-800/80 dark:text-violet-300/80 mt-1 leading-relaxed">
              Sponsored businesses appear at the top of search results for your category and service area, clearly labelled as &ldquo;Sponsored.&rdquo; Only 2 businesses can be sponsored per category + service area at a time.
            </p>
            <div className="flex flex-wrap gap-4 mt-3 text-sm font-medium text-violet-900 dark:text-violet-200">
              <span className="flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 text-violet-600" /> Top of search results
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 text-violet-600" /> Sponsored badge on your card
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 text-violet-600" /> Monthly subscription — cancel anytime
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Apply section */}
      {isApproved && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 space-y-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">Apply for a Sponsored Slot</h3>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block">Your category</label>
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300">
              {professional.category.icon} {professional.category.name}
            </div>
          </div>

          {professional.serviceAreas.length > 0 ? (
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block">Service area to sponsor</label>
              <select
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-400"
              >
                {professional.serviceAreas.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
          ) : (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              You have no service areas on your profile. Update your profile to add service areas before applying.
            </p>
          )}

          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Info className="h-4 w-4 flex-shrink-0" />
            <span>Starting at <span className="font-semibold text-gray-900 dark:text-white">$49 CAD/month</span> · Exact pricing will be confirmed by an admin</span>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">{success}</p>}

          <Button
            onClick={handleApply}
            disabled={!!loading || !selectedArea || hasActiveOrPending}
            className="bg-violet-600 hover:bg-violet-700 text-white gap-1.5"
          >
            <Sparkles className="h-4 w-4" />
            {hasActiveOrPending ? "You already have a pending or active slot" : `Apply — ${professional.category.name} in ${selectedAreaName}`}
            {!hasActiveOrPending && <ArrowRight className="h-4 w-4" />}
          </Button>
          {hasActiveOrPending && (
            <p className="text-xs text-gray-400">Cancel your current sponsored listing to apply for a different slot.</p>
          )}
        </div>
      )}

      {!isApproved && (
        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50 rounded-xl p-4 text-sm text-amber-700 dark:text-amber-300">
          Your professional profile must be approved before you can apply for a sponsored listing.
        </div>
      )}

      {/* Current listings */}
      {listings.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900 dark:text-white">Your Sponsored Applications</h3>
          {listings.map((l) => {
            const ui = STATUS_UI[l.status] ?? STATUS_UI.PENDING;
            return (
              <div key={l.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${ui.color}`}>
                        {ui.icon} {ui.label}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white mt-1.5">
                      {l.category.icon} {l.category.name} · {l.serviceArea.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      ${Number(l.priceMonthly).toFixed(0)} CAD/month
                      {l.startDate && ` · Active since ${new Date(l.startDate).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" })}`}
                    </p>
                    {l.adminNote && l.status === "REJECTED" && (
                      <p className="text-xs text-red-700 mt-1">Reason: {l.adminNote}</p>
                    )}
                  </div>
                  {(l.status === "ACTIVE" || l.status === "PENDING") && (
                    <button
                      onClick={() => handleCancel(l.id)}
                      disabled={!!loading}
                      className="text-xs text-gray-400 hover:text-red-600 transition-colors underline flex-shrink-0"
                    >
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
          <p className="text-sm text-gray-500 dark:text-gray-400 -mt-2">
            You&apos;ll be notified when a slot opens up.
          </p>
          {waitlist.map((w) => (
            <div key={w.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {w.category.icon} {w.category.name} · {w.serviceArea.name}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  On waitlist since {new Date(w.createdAt).toLocaleDateString("en-CA", { month: "short", day: "numeric" })}
                  {w.notifiedAt && " · Slot available — apply now!"}
                </p>
              </div>
              <button
                onClick={() => handleLeaveWaitlist(w.category.id, w.serviceArea.id)}
                disabled={!!loading}
                className="text-xs text-gray-400 hover:text-red-600 transition-colors underline flex-shrink-0"
              >
                Leave
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 text-center">
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{label}</p>
    </div>
  );
}
