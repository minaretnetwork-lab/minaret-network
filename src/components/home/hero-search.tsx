"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, LocateFixed, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type Suggestion = { label: string; type: "category" | "professional"; slug?: string };

export function HeroSearch() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [sugOpen, setSugOpen] = useState(false);
  const [activeSug, setActiveSug] = useState(-1);

  const [location, setLocation] = useState("");
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState("");

  const router = useRouter();
  const queryRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        queryRef.current && !queryRef.current.contains(e.target as Node)
      ) {
        setSugOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const fetchSuggestions = useCallback((val: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.length < 2) { setSuggestions([]); setSugOpen(false); return; }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/suggestions?q=${encodeURIComponent(val)}`);
        const data: Suggestion[] = await res.json();
        setSuggestions(data);
        setSugOpen(data.length > 0);
        setActiveSug(-1);
      } catch { /* ignore */ }
    }, 220);
  }, []);

  function handleQueryChange(val: string) {
    setQuery(val);
    fetchSuggestions(val);
  }

  function selectSuggestion(s: Suggestion) {
    // Strip leading emoji/icon from label for the input value
    const cleanLabel = s.label.replace(/^\S+\s/, s.type === "category" && s.label.match(/^\S\s/) ? "" : s.label);
    setQuery(cleanLabel);
    setSugOpen(false);
    const params = new URLSearchParams();
    if (location.trim()) params.set("location", location.trim());
    if (s.type === "category" && s.slug) {
      params.set("category", s.slug);
    } else {
      params.set("q", cleanLabel);
    }
    router.push(`/professionals?${params.toString()}`);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!sugOpen || suggestions.length === 0) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveSug((i) => Math.min(i + 1, suggestions.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setActiveSug((i) => Math.max(i - 1, -1)); }
    if (e.key === "Enter" && activeSug >= 0) { e.preventDefault(); selectSuggestion(suggestions[activeSug]); }
    if (e.key === "Escape") { setSugOpen(false); setActiveSug(-1); }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSugOpen(false);
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (location.trim()) params.set("location", location.trim());
    router.push(`/professionals${params.size ? `?${params}` : ""}`);
  }

  async function detectLocation() {
    if (!("geolocation" in navigator)) {
      setLocateError("Not supported by your browser.");
      return;
    }
    setLocating(true);
    setLocateError("");
    setLocation("");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=en`
          );
          const data = await res.json();
          const city =
            data.address?.village ??
            data.address?.town ??
            data.address?.suburb ??
            data.address?.quarter ??
            data.address?.city ??
            data.address?.municipality ??
            data.address?.county ??
            "";
          if (city) {
            setLocation(city);
            setLocateError("");
          } else {
            setLocateError("Couldn't determine your city.");
          }
        } catch {
          setLocateError("Lookup failed. Type your city.");
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        setLocating(false);
        setLocateError(err.code === err.PERMISSION_DENIED ? "Permission denied." : "Failed. Type your city.");
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  }

  return (
    <div className="w-full max-w-2xl">
      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">

        {/* ── Keyword with autocomplete ── */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40 pointer-events-none z-10" />
          <input
            ref={queryRef}
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => suggestions.length > 0 && setSugOpen(true)}
            placeholder="Service, category, or name"
            autoComplete="off"
            className="w-full h-12 pl-11 pr-4 rounded-lg text-base border border-white/30 bg-white/10 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white backdrop-blur"
          />

          {/* Suggestions dropdown */}
          {sugOpen && suggestions.length > 0 && (
            <div
              ref={dropdownRef}
              className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden"
            >
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); selectSuggestion(s); }}
                  className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 transition-colors ${
                    i === activeSug
                      ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300"
                      : "text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  <span className="text-gray-400 text-xs uppercase tracking-wide w-16 flex-shrink-0">
                    {s.type === "category" ? "Category" : "Pro"}
                  </span>
                  <span>{s.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Location with GPS icon inside ── */}
        <div className="relative sm:w-52">
          <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40 pointer-events-none z-10" />
          <input
            type="text"
            value={location}
            onChange={(e) => { setLocation(e.target.value); setLocateError(""); }}
            placeholder="City or area"
            className="w-full h-12 pl-11 pr-9 rounded-lg text-base border border-white/30 bg-white/10 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white backdrop-blur"
          />
          {/* GPS / clear button inside the input */}
          <button
            type="button"
            onClick={location ? () => { setLocation(""); setLocateError(""); } : detectLocation}
            disabled={locating}
            title={location ? "Clear" : "Use my location"}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors disabled:opacity-40"
          >
            {locating
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : location
              ? <X className="h-4 w-4" />
              : <LocateFixed className="h-4 w-4" />
            }
          </button>
        </div>

        <Button
          type="submit"
          size="lg"
          className="h-12 bg-white text-emerald-900 hover:bg-emerald-50 font-semibold px-8 flex-shrink-0"
        >
          Find
        </Button>
      </form>

      {/* Location error / GPS hint */}
      <div className="mt-1.5 min-h-[1.25rem]">
        {locateError ? (
          <p className="text-xs text-amber-300/80">{locateError}</p>
        ) : !location ? (
          <p className="text-xs text-white/35">
            <LocateFixed className="inline h-3 w-3 mr-1 -mt-0.5" />
            Tap the <span className="text-white/50">crosshair</span> in the location box to auto-detect
          </p>
        ) : null}
      </div>
    </div>
  );
}
