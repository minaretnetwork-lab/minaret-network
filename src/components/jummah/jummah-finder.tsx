"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Search, Navigation, Clock, AlertCircle, CheckCircle2, ChevronDown, X } from "lucide-react";
import type { MosqueWithJummah } from "@/lib/actions/jummah";
import { submitJummahCorrection } from "@/lib/actions/jummah";

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatReportedDate(d: Date) {
  return new Date(d).toLocaleDateString("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

type CorrectionForm = {
  mosqueId: string;
  mosqueName: string;
  session: string;
  proposedKhutbahTime: string;
  proposedIqamahTime: string;
  submitterNote: string;
};

const SESSION_LABELS: Record<string, string> = {
  J1: "1st Jumu'ah",
  J2: "2nd Jumu'ah",
  J3: "3rd Jumu'ah",
  J4: "4th Jumu'ah",
};

export function JummahFinder({ mosques }: { mosques: MosqueWithJummah[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState("");

  const [correction, setCorrection] = useState<CorrectionForm | null>(null);
  const [correctionSent, setCorrectionSent] = useState(false);
  const [correctionError, setCorrectionError] = useState("");
  const [isPending, startTransition] = useTransition();

  const cities = useMemo(() => {
    const set = new Set<string>();
    for (const m of mosques) if (m.city) set.add(m.city);
    return Array.from(set).sort();
  }, [mosques]);

  const withTimings = useMemo(() => mosques.filter((m) => m.timings.length > 0), [mosques]);
  const withoutTimings = useMemo(() => mosques.filter((m) => m.timings.length === 0), [mosques]);

  const filtered = useMemo(() => {
    let list = withTimings;

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          (m.city ?? "").toLowerCase().includes(q) ||
          (m.address ?? "").toLowerCase().includes(q)
      );
    }

    if (cityFilter) {
      list = list.filter((m) => m.city === cityFilter);
    }

    if (userLocation) {
      list = list
        .map((m) => ({
          ...m,
          distKm:
            m.latitude != null && m.longitude != null
              ? haversineKm(userLocation.lat, userLocation.lng, m.latitude, m.longitude)
              : Infinity,
        }))
        .sort((a, b) => a.distKm - b.distKm);
    }

    return list;
  }, [withTimings, search, cityFilter, userLocation]);

  function locate() {
    setLocError("");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        setLocError("Could not access your location. Please check browser permissions.");
        setLocating(false);
      }
    );
  }

  function openCorrection(mosque: MosqueWithJummah) {
    setCorrection({
      mosqueId: mosque.id,
      mosqueName: mosque.name,
      session: mosque.timings[0]?.session ?? "J1",
      proposedKhutbahTime: "",
      proposedIqamahTime: "",
      submitterNote: "",
    });
    setCorrectionSent(false);
    setCorrectionError("");
  }

  function submitCorrection() {
    if (!correction) return;
    if (!correction.session) {
      setCorrectionError("Please select which Jumu'ah session you're correcting.");
      return;
    }
    setCorrectionError("");
    startTransition(async () => {
      try {
        await submitJummahCorrection({
          mosqueId: correction.mosqueId,
          session: correction.session,
          proposedKhutbahTime: correction.proposedKhutbahTime || undefined,
          proposedIqamahTime: correction.proposedIqamahTime || undefined,
          submitterNote: correction.submitterNote || undefined,
        });
        setCorrectionSent(true);
        router.refresh();
      } catch (e) {
        setCorrectionError(e instanceof Error ? e.message : "Submission failed.");
      }
    });
  }

  return (
    <main className="min-h-[70vh] bg-white dark:bg-gray-950">
      <div className="container mx-auto max-w-5xl px-4 py-12">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            <h1
              className="text-3xl font-bold text-gray-900 dark:text-white"
              style={{ fontFamily: "var(--font-lora)" }}
            >
              Never Miss a Jumu&apos;ah
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl">
            Jumu&apos;ah prayer times for mosques across the GTA, reported by the community.
            If you notice incorrect times, submit a correction — it updates immediately.
          </p>
        </div>

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search mosque name or city…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="relative">
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="">All cities</option>
              {cities.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>

          <button
            onClick={locate}
            disabled={locating}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-medium text-gray-700 dark:text-gray-300 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors disabled:opacity-60 whitespace-nowrap"
          >
            <Navigation className="h-4 w-4" />
            {locating ? "Locating…" : userLocation ? "Location active" : "Near me"}
          </button>
        </div>

        {locError && (
          <p className="mb-4 text-sm text-red-600 dark:text-red-400 flex items-center gap-1.5">
            <AlertCircle className="h-4 w-4 shrink-0" /> {locError}
          </p>
        )}

        {userLocation && (
          <div className="mb-4 flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400">
            <Navigation className="h-3.5 w-3.5" />
            Showing nearest mosques first
            <button
              onClick={() => setUserLocation(null)}
              className="ml-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Results count */}
        <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">
          {filtered.length === 0
            ? "No mosques found"
            : `${filtered.length} mosque${filtered.length === 1 ? "" : "s"} with Jumu'ah times`}
          {withoutTimings.length > 0 && (
            <span className="ml-2 text-gray-400">
              · {withoutTimings.length} without listed times
            </span>
          )}
        </p>

        {/* Mosque cards */}
        <div className="space-y-4">
          {filtered.map((mosque) => {
            const latestReport = mosque.timings.reduce(
              (latest, t) =>
                t.lastReportedAt > latest ? t.lastReportedAt : latest,
              mosque.timings[0]?.lastReportedAt ?? new Date(0)
            );

            return (
              <div
                key={mosque.id}
                className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden"
              >
                {/* Card header */}
                <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold text-gray-900 dark:text-white text-base">
                      {mosque.name}
                    </h2>
                    {(mosque.city || mosque.address) && (
                      <p className="flex items-center gap-1 mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        {[mosque.address, mosque.city].filter(Boolean).join(", ")}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    {mosque.website && (
                      <a
                        href={mosque.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
                      >
                        Website ↗
                      </a>
                    )}
                    <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                      Last reported: {formatReportedDate(latestReport)}
                    </p>
                  </div>
                </div>

                {/* Timings table */}
                <div className="px-5 py-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500">
                          <th className="text-left pb-2 pr-6 font-medium">Session</th>
                          <th className="text-left pb-2 pr-6 font-medium">Khutbah</th>
                          <th className="text-left pb-2 pr-6 font-medium">Iqamah</th>
                          <th className="text-left pb-2 font-medium">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {mosque.timings.map((t) => (
                          <tr key={t.session}>
                            <td className="py-2 pr-6 font-medium text-gray-800 dark:text-gray-200 whitespace-nowrap">
                              {SESSION_LABELS[t.session] ?? t.session}
                            </td>
                            <td className="py-2 pr-6 text-gray-700 dark:text-gray-300 whitespace-nowrap font-mono tabular-nums">
                              {t.khutbahTime ?? <span className="text-gray-300 dark:text-gray-600">—</span>}
                            </td>
                            <td className="py-2 pr-6 text-gray-700 dark:text-gray-300 whitespace-nowrap font-mono tabular-nums">
                              {t.iqamahTime ?? <span className="text-gray-300 dark:text-gray-600">—</span>}
                            </td>
                            <td className="py-2 text-gray-500 dark:text-gray-400 text-xs">
                              {t.notes ?? ""}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <button
                    onClick={() => openCorrection(mosque)}
                    className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#CE1126] hover:bg-[#b00e20] text-xs font-medium text-white transition-colors"
                  >
                    <AlertCircle className="h-3.5 w-3.5" />
                    Submit a correction
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mosques without timings */}
        {withoutTimings.length > 0 && !search && !cityFilter && (
          <details className="mt-8 group">
            <summary className="cursor-pointer text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 list-none flex items-center gap-1.5">
              <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
              {withoutTimings.length} registered mosque{withoutTimings.length !== 1 ? "s" : ""} without listed times
            </summary>
            <ul className="mt-3 grid sm:grid-cols-2 gap-2">
              {withoutTimings.map((m) => (
                <li
                  key={m.id}
                  className="flex items-center justify-between px-4 py-3 rounded-lg border border-gray-100 dark:border-gray-800 text-sm"
                >
                  <span className="text-gray-700 dark:text-gray-300">{m.name}</span>
                  <button
                    onClick={() => openCorrection(m)}
                    className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline ml-3 shrink-0"
                  >
                    Add times
                  </button>
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>

      {/* Correction modal */}
      {correction && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setCorrection(null); }}
        >
          <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Submit a Correction
                </h3>
                <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                  {correction.mosqueName}
                </p>
              </div>
              <button
                onClick={() => setCorrection(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {correctionSent ? (
              <div className="px-6 py-8 text-center">
                <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
                <p className="font-medium text-gray-900 dark:text-white">Updated!</p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  The times have been updated. Thank you for keeping this accurate.
                </p>
                <button
                  onClick={() => setCorrection(null)}
                  className="mt-4 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors"
                >
                  Close
                </button>
              </div>
            ) : (
              <div className="px-6 py-5 space-y-4">
                {/* Session picker */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Session <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={correction.session}
                    onChange={(e) =>
                      setCorrection((c) => c && { ...c, session: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="J1">1st Jumu&apos;ah</option>
                    <option value="J2">2nd Jumu&apos;ah</option>
                    <option value="J3">3rd Jumu&apos;ah</option>
                    <option value="J4">4th Jumu&apos;ah</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Khutbah time
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 1:30 PM"
                      value={correction.proposedKhutbahTime}
                      onChange={(e) =>
                        setCorrection((c) => c && { ...c, proposedKhutbahTime: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Iqamah time
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 2:00 PM"
                      value={correction.proposedIqamahTime}
                      onChange={(e) =>
                        setCorrection((c) => c && { ...c, proposedIqamahTime: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Note <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. 'These are summer timings'"
                    value={correction.submitterNote}
                    onChange={(e) =>
                      setCorrection((c) => c && { ...c, submitterNote: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  />
                </div>

                {correctionError && (
                  <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1.5">
                    <AlertCircle className="h-4 w-4 shrink-0" /> {correctionError}
                  </p>
                )}

                <div className="flex gap-3 pt-1">
                  <button
                    onClick={() => setCorrection(null)}
                    className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitCorrection}
                    disabled={isPending}
                    className="flex-1 px-4 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-60"
                  >
                    {isPending ? "Updating…" : "Update times"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
