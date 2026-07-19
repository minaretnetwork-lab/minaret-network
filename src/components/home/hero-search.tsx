"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, LocateFixed, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type Suggestion = { label: string; type: "category" | "professional"; slug?: string };

export function HeroSearch({ light = false }: { light?: boolean }) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [sugOpen, setSugOpen] = useState(false);
  const [activeSug, setActiveSug] = useState(-1);

  const [location, setLocation] = useState("");
  const [locationSugs, setLocationSugs] = useState<Suggestion[]>([]);
  const [locSugOpen, setLocSugOpen] = useState(false);
  const [activeLocSug, setActiveLocSug] = useState(-1);
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState("");

  const router = useRouter();
  const queryRef = useRef<HTMLInputElement>(null);
  const locationRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const locDropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const locDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        queryRef.current && !queryRef.current.contains(e.target as Node)
      ) setSugOpen(false);
      if (
        locDropdownRef.current && !locDropdownRef.current.contains(e.target as Node) &&
        locationRef.current && !locationRef.current.contains(e.target as Node)
      ) setLocSugOpen(false);
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

  const fetchLocationSuggestions = useCallback((val: string) => {
    if (locDebounceRef.current) clearTimeout(locDebounceRef.current);
    if (val.length < 2) { setLocationSugs([]); setLocSugOpen(false); return; }
    locDebounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/suggestions?type=location&q=${encodeURIComponent(val)}`);
        const data: Suggestion[] = await res.json();
        setLocationSugs(data);
        setLocSugOpen(data.length > 0);
        setActiveLocSug(-1);
      } catch { /* ignore */ }
    }, 220);
  }, []);

  function handleQueryChange(val: string) {
    setQuery(val);
    fetchSuggestions(val);
  }

  function handleLocationChange(val: string) {
    setLocation(val);
    setLocateError("");
    fetchLocationSuggestions(val);
  }

  function selectLocationSuggestion(s: Suggestion) {
    setLocation(s.label);
    setLocSugOpen(false);
  }

  function handleLocationKeyDown(e: React.KeyboardEvent) {
    if (!locSugOpen || locationSugs.length === 0) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveLocSug((i) => Math.min(i + 1, locationSugs.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setActiveLocSug((i) => Math.max(i - 1, -1)); }
    if (e.key === "Enter" && activeLocSug >= 0) { e.preventDefault(); selectLocationSuggestion(locationSugs[activeLocSug]); }
    if (e.key === "Escape") { setLocSugOpen(false); setActiveLocSug(-1); }
  }

  const pendingSuggestion = useRef<Suggestion | null>(null);

  function selectSuggestion(s: Suggestion) {
    const cleanLabel = s.label.replace(/^\S+\s/, s.type === "category" && s.label.match(/^\S\s/) ? "" : s.label);
    setQuery(cleanLabel);
    setSugOpen(false);
    pendingSuggestion.current = s;
    // Move focus to location if empty so the user fills it in next
    if (!location.trim()) {
      locationRef.current?.focus();
    }
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
    if (!location.trim()) {
      setLocateError("Please enter your city or use the location button.");
      locationRef.current?.focus();
      return;
    }
    const params = new URLSearchParams();
    const pending = pendingSuggestion.current;
    if (pending && pending.type === "category" && pending.slug) {
      params.set("category", pending.slug);
    } else if (query.trim()) {
      params.set("q", query.trim());
    }
    params.set("location", location.trim());
    pendingSuggestion.current = null;
    router.push(`/professionals?${params.toString()}`);
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

  // Styling helpers based on light/dark mode
  const inputBase = light
    ? "w-full h-12 pl-11 pr-4 rounded-xl text-base border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 shadow-sm"
    : "w-full h-12 pl-11 pr-4 rounded-lg text-base border border-white/30 bg-white/10 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white backdrop-blur";

  const iconClass = light ? "text-gray-400" : "text-white/40";
  const gpsClass = light ? "text-gray-400 hover:text-gray-600" : "text-white/40 hover:text-white/80";
  const errorClass = light ? "text-amber-600" : "text-amber-300/80";
  const hintClass = light ? "text-gray-400" : "text-white/35";
  const hintHighlight = light ? "text-gray-500" : "text-white/50";

  return (
    <div className="w-full max-w-2xl">
      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">

        {/* Keyword with autocomplete */}
        <div className="relative flex-1">
          <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 ${iconClass} pointer-events-none z-10`} />
          <input
            ref={queryRef}
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => suggestions.length > 0 && setSugOpen(true)}
            placeholder="Service, category, or name"
            autoComplete="off"
            className={inputBase}
          />

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

        {/* Location with GPS icon + autocomplete */}
        <div className="relative sm:w-52">
          <MapPin className={`absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 ${iconClass} pointer-events-none z-10`} />
          <input
            ref={locationRef}
            type="text"
            value={location}
            onChange={(e) => handleLocationChange(e.target.value)}
            onKeyDown={handleLocationKeyDown}
            onFocus={() => locationSugs.length > 0 && setLocSugOpen(true)}
            placeholder="City or area"
            autoComplete="off"
            className={light
              ? "w-full h-12 pl-11 pr-9 rounded-xl text-base border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 shadow-sm"
              : "w-full h-12 pl-11 pr-9 rounded-lg text-base border border-white/30 bg-white/10 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white backdrop-blur"}
          />
          <button
            type="button"
            onClick={location ? () => { setLocation(""); setLocateError(""); setLocationSugs([]); setLocSugOpen(false); } : detectLocation}
            disabled={locating}
            title={location ? "Clear" : "Use my location"}
            className={`absolute right-2.5 top-1/2 -translate-y-1/2 ${gpsClass} transition-colors disabled:opacity-40`}
          >
            {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : location ? <X className="h-4 w-4" /> : <LocateFixed className="h-4 w-4" />}
          </button>

          {locSugOpen && locationSugs.length > 0 && (
            <div
              ref={locDropdownRef}
              className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden"
            >
              {locationSugs.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); selectLocationSuggestion(s); }}
                  className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 transition-colors ${
                    i === activeLocSug
                      ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300"
                      : "text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  <MapPin className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <Button
          type="submit"
          size="lg"
          className={light
            ? "h-12 bg-[#166534] hover:bg-[#14532d] text-white font-semibold px-8 flex-shrink-0 rounded-xl"
            : "h-12 bg-white text-emerald-900 hover:bg-emerald-50 font-semibold px-8 flex-shrink-0"}
        >
          Search
        </Button>
      </form>

      <div className="mt-1.5 min-h-[1.25rem]">
        {locateError ? (
          <p className={`text-xs ${errorClass}`}>{locateError}</p>
        ) : !location ? (
          <p className={`text-xs ${hintClass}`}>
            <LocateFixed className="inline h-3 w-3 mr-1 -mt-0.5" />
            Tap the <span className={hintHighlight}>crosshair</span> in the location box to auto-detect
          </p>
        ) : null}
      </div>
    </div>
  );
}
