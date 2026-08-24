"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Info, ImagePlus, X, MapPin } from "lucide-react";
import { submitEventListing } from "@/lib/actions/event-listings";
import { Button } from "@/components/ui/button";

type AddressSuggestion = { label: string; address: string; city: string | null; province: string | null };

const FREE_UNTIL = new Date("2026-11-01T00:00:00.000Z");
const isFreePromo = new Date() < FREE_UNTIL;

const PRICE_TABLE = {
  STANDARD: 24.99,
  FEATURED: 49.99,
  MOSQUE: 0,
} as const;

export default function SubmitEventPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [addressOpen, setAddressOpen] = useState(false);
  const [addressLoading, setAddressLoading] = useState(false);
  const addressRef = useRef<HTMLDivElement>(null);
  const [form, setForm] = useState({
    organizerName: "",
    organizerContact: "",
    title: "",
    description: "",
    eventDate: "",
    location: "",
    listingType: "STANDARD" as "STANDARD" | "FEATURED",
    isMosqueOrganized: false,
    mosqueName: "",
    mosqueAuthorizationConfirmed: false,
  });

  useEffect(() => { document.title = "Post an Event | Minaret Network"; }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (addressRef.current && !addressRef.current.contains(e.target as Node)) setAddressOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    const query = form.location.trim();
    if (query.length < 3) { setAddressSuggestions([]); setAddressLoading(false); return; }
    let cancelled = false;
    const t = window.setTimeout(async () => {
      setAddressLoading(true);
      try {
        const res = await fetch(`/api/geocode/search?q=${encodeURIComponent(query)}`);
        if (!res.ok) throw new Error();
        const data = await res.json() as { suggestions?: AddressSuggestion[] };
        if (!cancelled) { setAddressSuggestions(data.suggestions ?? []); setAddressOpen(true); }
      } catch { if (!cancelled) setAddressSuggestions([]); }
      finally { if (!cancelled) setAddressLoading(false); }
    }, 450);
    return () => { cancelled = true; window.clearTimeout(t); };
  }, [form.location]);

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    const preview = URL.createObjectURL(file);
    setImagePreview(preview);

    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await fetch("/api/events/upload-image", { method: "POST", body: fd });
      const result: { ok: boolean; url?: string; error?: string } = await res.json();
      if (!result.ok || !result.url) throw new Error(result.error ?? "Upload failed");
      setImageUrl(result.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Image upload failed. Please try again or continue without an image.");
      setImagePreview(null);
      setImageUrl(null);
    } finally {
      setUploading(false);
    }
  }

  function removeImage() {
    setImagePreview(null);
    setImageUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  const effectivePrice = form.isMosqueOrganized || isFreePromo
    ? 0
    : PRICE_TABLE[form.listingType];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const result = await submitEventListing({
        organizerName: form.organizerName,
        organizerContact: form.organizerContact,
        title: form.title,
        description: form.description,
        eventDate: form.eventDate,
        location: form.location,
        listingType: form.listingType,
        isMosqueOrganized: form.isMosqueOrganized,
        mosqueName: form.mosqueName || undefined,
        mosqueAuthorizationConfirmed: form.mosqueAuthorizationConfirmed,
        imageUrl: imageUrl ?? undefined,
      });

      if ("checkoutUrl" in result) {
        // Redirect to Stripe Checkout
        window.location.href = result.checkoutUrl;
      } else {
        // Mosque-organized — immediate activation
        router.push("/events/submit/success");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-[70vh] bg-white dark:bg-gray-950">
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <Link
          href="/events"
          className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-emerald-700 dark:text-gray-400 dark:hover:text-emerald-400 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Events
        </Link>

        <h1
          className="text-3xl font-bold text-gray-900 dark:text-white mb-2"
          style={{ fontFamily: "var(--font-lora)" }}
        >
          Post a Community Event
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
          Reach GTA mosque communities. Listings run for 30 days or until the event date, whichever comes first.
        </p>
        {isFreePromo && (
          <div className="inline-flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-full px-4 py-1.5 mb-8">
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">🎉 Limited-time offer</span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400">Posting is FREE until Oct 31, 2026</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">

          {/* Listing type */}
          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-gray-900 dark:text-white">Listing type</legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(["STANDARD", "FEATURED"] as const).map((type) => (
                <label
                  key={type}
                  className={`flex items-start gap-3 rounded-xl border-2 p-4 cursor-pointer transition ${
                    form.listingType === type && !form.isMosqueOrganized
                      ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="listingType"
                    value={type}
                    checked={form.listingType === type && !form.isMosqueOrganized}
                    onChange={() => { set("listingType", type); set("isMosqueOrganized", false); }}
                    className="mt-0.5 accent-emerald-600"
                  />
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {type === "STANDARD" ? "Standard" : "Featured"}{" "}
                      {isFreePromo ? (
                        <span className="font-bold text-emerald-600">— FREE</span>
                      ) : (
                        <span className="font-normal text-gray-500">
                          — ${type === "STANDARD" ? "24.99" : "49.99"} CAD
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {type === "STANDARD"
                        ? "Appears in the community events list."
                        : "Highlighted at the top of the list with a Featured badge."}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </fieldset>

          {/* Mosque toggle */}
          <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/10 p-4 space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isMosqueOrganized}
                onChange={(e) => set("isMosqueOrganized", e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-emerald-600"
              />
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  This event is organized by a mosque
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Mosque-organized events are listed for free. Self-reported — misrepresentation may result in removal.
                </p>
              </div>
            </label>

            {form.isMosqueOrganized && (
              <div className="space-y-3 pt-2 border-t border-emerald-200 dark:border-emerald-800">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Mosque name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required={form.isMosqueOrganized}
                    value={form.mosqueName}
                    onChange={(e) => set("mosqueName", e.target.value)}
                    placeholder="e.g. Al-Falah Islamic Centre"
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    required={form.isMosqueOrganized}
                    checked={form.mosqueAuthorizationConfirmed}
                    onChange={(e) => set("mosqueAuthorizationConfirmed", e.target.checked)}
                    className="mt-0.5 h-4 w-4 accent-emerald-600"
                  />
                  <p className="text-xs text-gray-700 dark:text-gray-300">
                    I confirm I am submitting this listing on behalf of{" "}
                    <strong>{form.mosqueName || "this mosque"}</strong> and am authorized to do so.
                  </p>
                </label>
              </div>
            )}
          </div>

          {/* Event image */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Event image <span className="font-normal text-gray-400">(optional)</span></p>
            <p className="text-xs text-gray-500">Add a banner or poster image — shown on the events page and detail page.</p>

            {imagePreview ? (
              <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50">
                <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                {uploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <span className="text-white text-sm font-medium">Uploading…</span>
                  </div>
                )}
                {!uploading && (
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 rounded-full bg-gray-900/70 p-1 text-white hover:bg-gray-900 transition"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-4 py-8 text-sm text-gray-500 hover:border-emerald-400 hover:text-emerald-600 transition cursor-pointer"
              >
                <ImagePlus className="h-5 w-5" />
                Click to upload an image
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </div>

          {/* Event details */}
          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold text-gray-900 dark:text-white">Event details</legend>

            <Field label="Event title" required>
              <input
                type="text"
                required
                maxLength={120}
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="e.g. Annual Bazaar & Community Dinner"
                className={inputCls}
              />
            </Field>

            <Field label="Description" required>
              <textarea
                required
                maxLength={1200}
                rows={4}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Tell the community what to expect — schedule, activities, who it's for."
                className={inputCls + " resize-none"}
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Event date & time" required>
                <input
                  type="datetime-local"
                  required
                  value={form.eventDate}
                  onChange={(e) => set("eventDate", e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="Location" required>
                <div ref={addressRef} className="relative">
                  <div className="relative">
                    <MapPin className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      required
                      value={form.location}
                      onChange={(e) => { set("location", e.target.value); setAddressOpen(true); }}
                      onFocus={() => { if (addressSuggestions.length) setAddressOpen(true); }}
                      placeholder="Start typing an address…"
                      className={inputCls + " pl-9"}
                      autoComplete="off"
                    />
                    {addressLoading && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">…</span>
                    )}
                  </div>
                  {addressOpen && addressSuggestions.length > 0 && (
                    <ul className="absolute z-50 mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg overflow-hidden text-sm">
                      {addressSuggestions.map((s, i) => (
                        <li key={i}>
                          <button
                            type="button"
                            className="w-full text-left px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            onClick={() => { set("location", s.address); setAddressOpen(false); setAddressSuggestions([]); }}
                          >
                            <span className="font-medium text-gray-900 dark:text-white">{s.address}</span>
                            {(s.city || s.province) && (
                              <span className="block text-xs text-gray-400 truncate">{[s.city, s.province].filter(Boolean).join(", ")}</span>
                            )}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </Field>
            </div>
          </fieldset>

          {/* Organizer */}
          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold text-gray-900 dark:text-white">Your details</legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Your name or organization" required>
                <input
                  type="text"
                  required
                  value={form.organizerName}
                  onChange={(e) => set("organizerName", e.target.value)}
                  placeholder="Name or organization"
                  className={inputCls}
                />
              </Field>
              <Field label="Contact (email or phone)" required>
                <input
                  type="text"
                  required
                  value={form.organizerContact}
                  onChange={(e) => set("organizerContact", e.target.value)}
                  placeholder="email@example.com"
                  className={inputCls}
                />
              </Field>
            </div>
          </fieldset>

          {/* Price summary */}
          <div className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-3 text-sm">
            <Info className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <span className="text-gray-600 dark:text-gray-400">
              {effectivePrice === 0
                ? isFreePromo && !form.isMosqueOrganized
                  ? <><strong className="text-emerald-700 dark:text-emerald-400">Free until Oct 31, 2026</strong> — no payment required. Regular pricing resumes Nov 1.</>
                  : "Mosque-organized listings are free. No payment step."
                : <>Total: <strong className="text-gray-900 dark:text-white">${effectivePrice.toFixed(2)} CAD</strong> — you&apos;ll complete payment via Stripe on the next screen.</>}
            </span>
          </div>

          {error && (
            <p className="rounded-xl border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-300">
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={submitting}
            className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-3"
          >
            {submitting
              ? "Please wait…"
              : effectivePrice === 0
              ? "Submit listing"
              : `Continue to payment — $${effectivePrice.toFixed(2)} CAD`}
          </Button>

          <p className="text-center text-xs text-gray-400">
            By submitting, you confirm this event is real and the information is accurate.
            Listings that violate our Terms may be removed without notice.
          </p>
        </form>
      </div>
    </main>
  );
}

const inputCls =
  "w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500";

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}
