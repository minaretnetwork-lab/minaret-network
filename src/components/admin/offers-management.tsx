"use client";

import Image from "next/image";
import { useState } from "react";
import { CheckCircle, XCircle, Megaphone, Plus, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { approveOffer, rejectOffer, adminCreateOffer, getApprovedProfessionalsForOfferPicker } from "@/lib/actions/offers";

type PickerProfessional = {
  id: string;
  businessName: string | null;
  user: { firstName: string | null; lastName: string | null; displayName: string | null; email: string };
  category: { name: string; icon: string } | null;
};

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

function AdminCreateOfferForm() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchingPros, setFetchingPros] = useState(false);
  const [professionals, setProfessionals] = useState<PickerProfessional[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    professionalId: "",
    title: "",
    description: "",
    startDate: "",
    endDate: "",
  });

  async function handleOpen() {
    setOpen(true);
    if (professionals.length > 0) return;
    setFetchingPros(true);
    try {
      const list = await getApprovedProfessionalsForOfferPicker();
      setProfessionals(list as PickerProfessional[]);
    } catch {
      setError("Could not load professionals list");
    } finally {
      setFetchingPros(false);
    }
  }

  const proLabel = (p: PickerProfessional) => {
    const fullName = [p.user?.firstName, p.user?.lastName].filter(Boolean).join(" ");
    const name = p.businessName ?? (p.user?.displayName ?? (fullName || p.user?.email ?? "Unknown"));
    const cat = p.category?.name ?? "";
    const icon = p.category?.icon ?? "";
    return `${icon} ${name} — ${cat}`.trim();
  };

  const filtered = professionals.filter((p) =>
    proLabel(p).toLowerCase().includes(search.toLowerCase())
  );

  const selected = professionals.find((p) => p.id === form.professionalId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.professionalId) { setError("Select a business first"); return; }
    if (!form.title.trim()) { setError("Title is required"); return; }
    if (!form.description.trim()) { setError("Description is required"); return; }
    if (!form.startDate || !form.endDate) { setError("Start and end dates are required"); return; }
    setLoading(true);
    try {
      await adminCreateOffer(form);
      setSuccess(true);
      setForm({ professionalId: "", title: "", description: "", startDate: "", endDate: "" });
      setSearch("");
      setTimeout(() => { setSuccess(false); setOpen(false); }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create offer");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <Button
        onClick={handleOpen}
        className="bg-emerald-700 hover:bg-emerald-800 text-white gap-2"
      >
        <Plus className="h-4 w-4" />
        Post offer on behalf of a business
      </Button>
    );
  }

  return (
    <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Post offer on behalf of a business</h3>
        <button onClick={() => setOpen(false)} className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Professional picker */}
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Business *</label>
          {fetchingPros && <p className="text-xs text-gray-400 mb-2">Loading businesses…</p>}
          <div className="relative">
            <input
              type="text"
              placeholder="Search by name or category…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setForm((f) => ({ ...f, professionalId: "" })); }}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
          {selected && !search && (
            <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-400 font-medium">
              Selected: {proLabel(selected)}
            </p>
          )}
          {search && filtered.length > 0 && (
            <ul className="mt-1 max-h-48 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg divide-y divide-gray-100 dark:divide-gray-700">
              {filtered.slice(0, 20).map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => { setForm((f) => ({ ...f, professionalId: p.id })); setSearch(""); }}
                    className="w-full text-left px-3 py-2 text-sm text-gray-800 dark:text-gray-200 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                  >
                    {proLabel(p)}
                    <span className="block text-xs text-gray-400">{p.user.email}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {search && filtered.length === 0 && (
            <p className="mt-1 text-xs text-gray-400">No approved professionals match</p>
          )}
        </div>

        {/* Title */}
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Offer title *</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="e.g. 10% off home inspection this week"
            className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Description *</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={3}
            placeholder="Details of the offer…"
            className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
          />
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Start date *</label>
            <input
              type="date"
              value={form.startDate}
              onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">End date * (max 30 days)</label>
            <input
              type="date"
              value={form.endDate}
              onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {error && <p className="text-xs text-red-600">{error}</p>}
        {success && <p className="text-xs text-green-600 font-medium">Offer posted and live!</p>}

        <Button
          type="submit"
          disabled={loading}
          className="bg-emerald-700 hover:bg-emerald-800 text-white"
        >
          {loading ? "Posting…" : "Post offer (goes live immediately)"}
        </Button>
      </form>
    </div>
  );
}

export function OffersAdminPanel({ pending, active, recent }: Props) {
  return (
    <div className="space-y-8">
      {/* Admin create */}
      <AdminCreateOfferForm />

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
