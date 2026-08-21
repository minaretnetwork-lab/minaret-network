"use client";

import { useState } from "react";
import Image from "next/image";
import { CheckCircle, Clock, XCircle, Megaphone, Plus, X, AlertCircle, CalendarDays, Star, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { submitOffer, cancelMyOffer, uploadOfferImage } from "@/lib/actions/offers";
import { TIER_PRICING, getTierFromDays, getPriceForDays } from "@/lib/offers/pricing";

type Offer = {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  tier: string;
  price: number | string;
  status: string;
  startDate: string | null;
  expiresAt: string | null;
  adminNote: string | null;
  createdAt: string;
};

type Professional = {
  id: string;
  phone: string | null;
  whatsapp: string | null;
};

interface Props {
  offers: Offer[];
  professional: Professional;
}

const STATUS_UI: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  PENDING:   { label: "Pending Review", color: "text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900 dark:text-amber-400", icon: <Clock className="h-3.5 w-3.5" /> },
  ACTIVE:    { label: "Active",         color: "text-green-700 bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-900 dark:text-green-400", icon: <CheckCircle className="h-3.5 w-3.5" /> },
  REJECTED:  { label: "Rejected",       color: "text-red-700 bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-900 dark:text-red-400", icon: <XCircle className="h-3.5 w-3.5" /> },
  EXPIRED:   { label: "Expired",        color: "text-gray-600 bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400", icon: <Clock className="h-3.5 w-3.5" /> },
  CANCELLED: { label: "Cancelled",      color: "text-gray-600 bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400", icon: <XCircle className="h-3.5 w-3.5" /> },
};

const FREE_PERIOD_END = new Date("2026-11-01T00:00:00.000Z");

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function maxEndStr(startStr: string) {
  if (!startStr) return "";
  const d = new Date(startStr + "T00:00:00");
  d.setDate(d.getDate() + 30);
  return d.toISOString().slice(0, 10);
}

function daysBetween(start: string, end: string) {
  if (!start || !end) return 0;
  const s = new Date(start + "T00:00:00");
  const e = new Date(end + "T23:59:59");
  return Math.max(0, Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)));
}

export function OffersDashboard({ offers, professional }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [startDate, setStartDate] = useState(todayStr());
  const [endDate, setEndDate] = useState("");
  const [complianceAcknowledged, setComplianceAcknowledged] = useState(false);

  const inFreePeriod = new Date() < FREE_PERIOD_END;
  const hasContact = professional.phone || professional.whatsapp;

  // Live price preview
  const days = daysBetween(startDate, endDate);
  const tier = days > 0 ? getTierFromDays(days) : null;
  const price = days > 0 ? getPriceForDays(days) : null;
  const tierInfo = tier ? TIER_PRICING[tier] : null;

  function resetForm() {
    setTitle(""); setDescription(""); setImageUrl(""); setImagePreview(null);
    setStartDate(todayStr()); setEndDate("");
    setComplianceAcknowledged(false); setError(null);
  }

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImagePreview(URL.createObjectURL(file));
    setImageUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const url = await uploadOfferImage(fd);
      setImageUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Image upload failed");
      setImagePreview(null);
    } finally {
      setImageUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!endDate) { setError("Please select an end date"); return; }
    if (days < 1) { setError("End date must be after start date"); return; }
    if (days > 30) { setError("Maximum duration is 30 days"); return; }
    setError(null);
    setSubmitting(true);
    try {
      await submitOffer({ title, description, imageUrl: imageUrl || undefined, startDate, endDate });
      setSuccess(true);
      setShowForm(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancel(offerId: string) {
    if (!confirm("Cancel this offer?")) return;
    setCancellingId(offerId);
    try {
      await cancelMyOffer(offerId);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not cancel offer");
    } finally {
      setCancellingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* No contact warning */}
      {!hasContact && (
        <div className="flex gap-3 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/30 p-4">
          <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-400">Add your contact info first</p>
            <p className="text-sm text-amber-700 dark:text-amber-500 mt-0.5">
              Community members need a way to reach you. Add a phone or WhatsApp number to your professional profile before posting an offer.
            </p>
          </div>
        </div>
      )}

      {/* Free period notice */}
      {inFreePeriod && (
        <div className="flex gap-3 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30 p-4">
          <Megaphone className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-emerald-800 dark:text-emerald-400">Free until October 31, 2026</p>
            <p className="text-sm text-emerald-700 dark:text-emerald-500 mt-0.5">
              All Community Offers are free during our launch period. Pricing kicks in November 1, 2026.
            </p>
          </div>
        </div>
      )}

      {/* Success */}
      {success && (
        <div className="flex gap-3 rounded-xl border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/30 p-4">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-800 dark:text-green-400">
            Your offer has been submitted for review. It will go live on your selected start date once approved.
          </p>
        </div>
      )}

      {/* Post offer button / form */}
      {!showForm ? (
        <Button onClick={() => { setShowForm(true); setSuccess(false); }} className="bg-emerald-700 hover:bg-emerald-800 text-white">
          <Plus className="h-4 w-4 mr-1.5" />
          Post a Community Offer
        </Button>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 space-y-5"
        >
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-semibold text-gray-900 dark:text-white text-lg">New Community Offer</h2>
            <button type="button" onClick={() => { setShowForm(false); resetForm(); }} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Date pickers */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <CalendarDays className="inline h-4 w-4 mr-1.5 text-gray-400" />
              Offer dates <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="offer-start" className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Start date</label>
                <input
                  id="offer-start"
                  type="date"
                  required
                  min={todayStr()}
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    // reset end date if it's now before the new start
                    if (endDate && endDate <= e.target.value) setEndDate("");
                  }}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label htmlFor="offer-end" className="block text-xs text-gray-500 dark:text-gray-400 mb-1">End date</label>
                <input
                  id="offer-end"
                  type="date"
                  required
                  min={startDate || todayStr()}
                  max={maxEndStr(startDate)}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Live price preview */}
            {tier && tierInfo && days > 0 && (
              <div className={`mt-3 flex items-center gap-3 rounded-xl px-4 py-3 border ${
                tier === "FEATURED"
                  ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900"
                  : "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900"
              }`}>
                {tier === "FEATURED" && <Star className="h-4 w-4 text-amber-500 flex-shrink-0" />}
                <div className="flex-1">
                  <p className={`text-sm font-semibold ${tier === "FEATURED" ? "text-amber-800 dark:text-amber-400" : "text-emerald-800 dark:text-emerald-400"}`}>
                    {days} day{days !== 1 ? "s" : ""} · {tierInfo.label}
                    {tier === "FEATURED" && " — shown first in the grid"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{tierInfo.description}</p>
                </div>
                <p className={`text-base font-bold ${tier === "FEATURED" ? "text-amber-700 dark:text-amber-400" : "text-emerald-700 dark:text-emerald-400"}`}>
                  {inFreePeriod ? "Free" : `$${price?.toFixed(2)}`}
                </p>
              </div>
            )}

            <p className="mt-2 text-xs text-gray-400">
              ≤3 days {inFreePeriod ? "(free)" : "→ $4.99"} · 4–7 days {inFreePeriod ? "(free)" : "→ $9.99"} · 8–30 days {inFreePeriod ? "(free)" : "→ $19.99"} · Max 30 days
            </p>
          </div>

          {/* Title */}
          <div>
            <label htmlFor="offer-title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Offer title <span className="text-red-500">*</span>
            </label>
            <input
              id="offer-title"
              type="text"
              required
              maxLength={100}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 20% off homemade food orders this weekend"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="offer-desc" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="offer-desc"
              required
              rows={4}
              maxLength={600}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your offer — what it is, who it's for, any conditions or pickup/delivery details."
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>

          {/* Image upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Offer image <span className="text-xs text-gray-400">(optional)</span>
            </label>
            {imagePreview ? (
              <div className="relative w-full h-44 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                <button
                  type="button"
                  onClick={() => { setImagePreview(null); setImageUrl(""); }}
                  className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
                {imageUploading && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <p className="text-white text-sm font-medium">Uploading…</p>
                  </div>
                )}
              </div>
            ) : (
              <label htmlFor="offer-image" className="flex flex-col items-center justify-center w-full h-32 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 cursor-pointer hover:border-emerald-400 dark:hover:border-emerald-600 transition-colors bg-gray-50 dark:bg-gray-800/50">
                <ImagePlus className="h-7 w-7 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">Click to upload an image</p>
                <p className="text-xs text-gray-400 mt-0.5">JPEG, PNG or WebP · max 5 MB</p>
                <p className="text-xs text-gray-400 mt-0.5">Best size: <strong className="text-gray-500 dark:text-gray-300">1200 × 800 px</strong> (landscape) — portrait images may be cropped</p>
                <input
                  id="offer-image"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Compliance acknowledgment */}
          <label className="flex gap-3 cursor-pointer">
            <input
              type="checkbox"
              required
              checked={complianceAcknowledged}
              onChange={(e) => setComplianceAcknowledged(e.target.checked)}
              className="mt-0.5 h-4 w-4 flex-shrink-0 accent-emerald-600"
            />
            <span className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
              I confirm that I hold all required licences, permits, and certifications to offer these products or services in Ontario — including any food handling or food premises permits required for food-related offers. I understand that Minaret Network does not verify this and that I am solely responsible for compliance with applicable laws.
            </span>
          </label>

          {error && (
            <div className="flex gap-2 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-900 p-3">
              <XCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <Button
              type="submit"
              disabled={submitting || imageUploading || !complianceAcknowledged || days < 1}
              className="bg-emerald-700 hover:bg-emerald-800 text-white disabled:opacity-50"
            >
              {imageUploading ? "Uploading image…" : submitting ? "Submitting…" : "Submit for review"}
            </Button>
            <Button type="button" variant="outline" onClick={() => { setShowForm(false); resetForm(); }}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {/* Existing offers */}
      {offers.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Your offers</h2>
          {offers.map((offer) => {
            const ui = STATUS_UI[offer.status] ?? STATUS_UI.EXPIRED;
            const canCancel = ["PENDING", "ACTIVE"].includes(offer.status);
            const start = offer.startDate ? new Date(offer.startDate) : null;
            const end = offer.expiresAt ? new Date(offer.expiresAt) : null;
            const daysLeft = end ? Math.ceil((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
            const fmt = (d: Date) => d.toLocaleDateString("en-CA", { month: "short", day: "numeric" });

            return (
              <div
                key={offer.id}
                className="flex flex-col sm:flex-row gap-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4"
              >
                {offer.imageUrl && (
                  <div className="relative w-full sm:w-28 h-28 flex-shrink-0 rounded-xl overflow-hidden">
                    <Image src={offer.imageUrl} alt={offer.title} fill className="object-cover" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap mb-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{offer.title}</h3>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${ui.color}`}>
                      {ui.icon} {ui.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">{offer.description}</p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                    {start && end && (
                      <span>{fmt(start)} – {fmt(end)}</span>
                    )}
                    {offer.status === "ACTIVE" && daysLeft !== null && daysLeft > 0 && (
                      <span className="text-emerald-600 font-medium">{daysLeft}d remaining</span>
                    )}
                    {offer.status === "PENDING" && start && start > new Date() && (
                      <span className="text-blue-500">Starts {fmt(start)}</span>
                    )}
                    {offer.status === "REJECTED" && offer.adminNote && (
                      <span className="text-red-500">{offer.adminNote}</span>
                    )}
                  </div>
                </div>
                {canCancel && (
                  <div className="flex-shrink-0">
                    <button
                      onClick={() => handleCancel(offer.id)}
                      disabled={cancellingId === offer.id}
                      className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                    >
                      {cancellingId === offer.id ? "Cancelling…" : "Cancel"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {offers.length === 0 && !showForm && (
        <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 py-16 text-center">
          <Megaphone className="h-10 w-10 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 font-medium mb-1">No offers yet</p>
          <p className="text-sm text-gray-400">Post a time-limited deal to reach mosque community members across the GTA.</p>
        </div>
      )}
    </div>
  );
}
