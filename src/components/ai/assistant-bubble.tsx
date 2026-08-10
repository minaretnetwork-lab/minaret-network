"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Bot, BriefcaseBusiness, Loader2, LocateFixed, Mail, MapPin, MessageCircle, Phone, Send, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  cacheDetectedCity,
  CITY_POSITION_OPTIONS,
  clearCachedDetectedCity,
  getCachedDetectedCity,
} from "@/lib/client-location";
import { cn } from "@/lib/utils";

const DRAFT_KEY = "minaret_draft_request";

type MatchResult = {
  classification: {
    issue_summary: string;
    matched_categories: string[];
    location_text: string | null;
    urgency: string;
    confidence: number;
  };
  matchedCategory: { id: string; name: string; icon?: string | null } | null;
  matchedArea: { id: string; name: string } | null;
  professionals: Array<{
    id: string;
    businessName: string;
    ownerName: string;
    ownerFirstName: string;
    category: { id: string; name: string; slug: string; icon?: string | null };
    serviceAreas: Array<{ id: string; name: string; slug: string }>;
    badges: string[];
    recommendationCount: number;
    isFeatured: boolean;
    isSponsored: boolean;
    profileUrl: string;
    whatsappUrl: string | null;
    emailUrl: string | null;
    callUrl: string | null;
  }>;
  draft: {
    categoryId: string;
    categoryName: string;
    categoryIcon: string;
    serviceAreaId: string;
    description: string;
    preferredContact: "EMAIL" | "PHONE" | "WHATSAPP";
    preferredDate: string;
  };
};

type Stage = "issue" | "location" | "results";

function storeBroadcastDraft(result: MatchResult, issue: string) {
  const form = {
    categoryId: result.draft.categoryId,
    categoryName: result.draft.categoryName,
    categoryIcon: result.draft.categoryIcon ?? "",
    serviceAreaId: result.draft.serviceAreaId,
    description: result.draft.description || issue,
    preferredContact: result.draft.preferredContact,
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    preferredDate: "",
  };

  window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ form, step: 3 }));
}

export function AssistantBubble() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState<Stage>("issue");
  const [issue, setIssue] = useState("");
  const [location, setLocation] = useState("");
  const [locating, setLocating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<MatchResult | null>(null);

  const canMatch = issue.trim().length >= 8 && location.trim().length >= 2;
  const resultIntro = useMemo(() => {
    if (!result) return "";
    const category = result.matchedCategory?.name ?? result.classification.matched_categories[0] ?? "professionals";
    const area = result.matchedArea?.name ?? result.classification.location_text ?? location;
    return `I matched this to ${category}${area ? ` near ${area}` : ""}.`;
  }, [location, result]);

  function reset() {
    setStage("issue");
    setIssue("");
    setLocation("");
    setError("");
    setResult(null);
    setLoading(false);
  }

  function detectLocation() {
    if (!("geolocation" in navigator)) {
      setError("Your browser does not support location detection. Type your city instead.");
      return;
    }

    const cachedCity = getCachedDetectedCity();
    if (cachedCity) {
      setLocation(cachedCity);
      setError("");
      return;
    }

    clearCachedDetectedCity();
    setLocating(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(`/api/geocode/reverse?lat=${latitude}&lon=${longitude}`);
          const payload = await response.json();
          if (!response.ok) throw new Error(payload.error ?? "Location lookup failed.");
          const city = payload.city ?? "";
          if (!city) throw new Error("Couldn't detect your city.");
          cacheDetectedCity(city);
          setLocation(city);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Location lookup failed. Type your city instead.");
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        setLocating(false);
        setError(
          err.code === err.PERMISSION_DENIED
            ? "Location permission is blocked. Type your city instead."
            : "Couldn't read your location. Type your city instead."
        );
      },
      CITY_POSITION_OPTIONS
    );
  }

  async function runMatch() {
    if (!canMatch) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/ai/match-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ issue, location }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Could not match your request.");
      setResult(payload as MatchResult);
      setStage("results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not match your request.");
    } finally {
      setLoading(false);
    }
  }

  async function startChat(professionalId: string) {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/ai/start-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ professionalId, issue, location }),
      });
      const payload = await response.json();
      if (response.status === 401) {
        try {
          window.sessionStorage.setItem("minaret_ai_pending_chat", JSON.stringify({ professionalId, issue, location }));
        } catch {
          // ignore
        }
        router.push(`/auth/login?redirectTo=${encodeURIComponent("/")}`);
        return;
      }
      if (response.status === 409 && payload.profileUrl) {
        setError("Please save your preferred contact method once, then come back to message professionals.");
        router.push(payload.profileUrl);
        return;
      }
      if (!response.ok) throw new Error(payload.error ?? "Could not start the chat.");
      router.push(payload.chatUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start the chat.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-2xl ring-4 ring-emerald-100 transition hover:bg-emerald-700 dark:ring-emerald-950"
        aria-label={open ? "Close AI assistant" : "Open AI assistant"}
      >
        {open ? <X className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
      </button>

      {open && (
        <section className="fixed bottom-24 right-4 z-50 flex max-h-[calc(100vh-8rem)] w-[calc(100vw-2rem)] max-w-md flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-950 sm:right-5">
          <div className="border-b border-gray-100 bg-emerald-700 px-5 py-4 text-white dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-semibold">Minaret match assistant</h2>
                <p className="text-xs text-emerald-50">Describe the issue. I’ll find real local listings.</p>
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            {stage === "issue" && (
              <div className="space-y-4">
                <div className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-700 dark:bg-gray-900 dark:text-gray-200">
                  What do you need help with? You can type it naturally, like “my sink is leaking” or “I need a barber before Friday.”
                </div>
                <Textarea
                  value={issue}
                  onChange={(event) => setIssue(event.target.value)}
                  rows={5}
                  placeholder="Describe the issue..."
                  className="min-h-32 resize-none bg-white text-base dark:bg-gray-950"
                />
                <Button
                  onClick={() => setStage("location")}
                  disabled={issue.trim().length < 8}
                  className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  Continue
                </Button>
              </div>
            )}

            {stage === "location" && (
              <div className="space-y-4">
                <div className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-700 dark:bg-gray-900 dark:text-gray-200">
                  Where should I search? Use your location or type a city/area.
                </div>
                <div className="space-y-2">
                  <Input
                    value={location}
                    onChange={(event) => setLocation(event.target.value)}
                    placeholder="City or area, e.g. Keswick"
                    className="h-11 bg-white text-base dark:bg-gray-950"
                  />
                  <button
                    type="button"
                    onClick={detectLocation}
                    disabled={locating}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 hover:text-emerald-800 disabled:opacity-50"
                  >
                    {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
                    Use my current location
                  </button>
                </div>
                {error && <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-700">{error}</p>}
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStage("issue")} className="flex-1">
                    Back
                  </Button>
                  <Button
                    onClick={runMatch}
                    disabled={!canMatch || loading}
                    className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Match
                  </Button>
                </div>
              </div>
            )}

            {stage === "results" && result && (
              <div className="space-y-4">
                <div className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-950 dark:bg-emerald-900/20 dark:text-emerald-100">
                  <p className="font-semibold">{resultIntro}</p>
                  <p className="mt-1 text-emerald-800 dark:text-emerald-200">{result.classification.issue_summary}</p>
                </div>

                {result.professionals.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-gray-200 p-5 text-center dark:border-gray-800">
                    <BriefcaseBusiness className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                    <p className="font-medium text-gray-900 dark:text-white">No direct matches yet</p>
                    <p className="mt-1 text-sm text-gray-500">You can still broadcast the request so matching professionals see it.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {result.professionals.map((professional) => (
                      <div key={professional.id} className="relative rounded-2xl border border-gray-200 p-4 transition hover:border-emerald-300 dark:border-gray-800">
                        <Link
                          href={professional.profileUrl}
                          aria-label={`View ${professional.businessName} profile`}
                          className="absolute inset-0 rounded-2xl"
                        />
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">{professional.businessName}</p>
                            <p className="text-sm text-gray-500">
                              {professional.ownerFirstName} · {professional.category.name}
                            </p>
                            <p className="mt-1 flex items-center gap-1 text-xs text-gray-400">
                              <MapPin className="h-3 w-3" />
                              {professional.serviceAreas.map((area) => area.name).join(", ")}
                            </p>
                          </div>
                          {(professional.isSponsored || professional.isFeatured || professional.recommendationCount > 0) && (
                            <span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700">
                              {professional.isSponsored ? "Sponsored" : professional.isFeatured ? "Featured" : `${professional.recommendationCount} recs`}
                            </span>
                          )}
                        </div>
                        <div className="relative z-10 mt-3 flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startChat(professional.id)}
                            disabled={loading}
                            className="w-full gap-1 border-emerald-200 text-emerald-700 sm:w-auto"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                            Message
                          </Button>
                          {professional.whatsappUrl && (
                            <a href={professional.whatsappUrl} target="_blank" rel="noreferrer" className="w-full sm:w-auto">
                              <Button size="sm" className="w-full gap-1 bg-green-600 text-white hover:bg-green-700 sm:w-auto">
                                <MessageCircle className="h-3.5 w-3.5" />
                                WhatsApp
                              </Button>
                            </a>
                          )}
                          {professional.emailUrl && (
                            <a href={professional.emailUrl} className="w-full sm:w-auto">
                              <Button size="sm" variant="outline" className="w-full gap-1 border-emerald-200 text-emerald-700 sm:w-auto">
                                <Mail className="h-3.5 w-3.5" />
                                Email
                              </Button>
                            </a>
                          )}
                          {professional.callUrl && (
                            <a href={professional.callUrl} className="w-full sm:w-auto">
                              <Button size="sm" variant="outline" className="w-full gap-1 border-emerald-200 text-emerald-700 sm:w-auto">
                                <Phone className="h-3.5 w-3.5" />
                                Call
                              </Button>
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {result.matchedCategory && (
                  <Link
                    href="/request"
                    onClick={() => storeBroadcastDraft(result, issue)}
                    className="block"
                  >
                    <Button className="w-full bg-emerald-700 text-white hover:bg-emerald-800">
                      Broadcast request for contact / quote
                    </Button>
                  </Link>
                )}
                <Button variant="outline" onClick={reset} className={cn("w-full", !result.matchedCategory && "mt-2")}>
                  Start another match
                </Button>
              </div>
            )}
          </div>
        </section>
      )}
    </>
  );
}
