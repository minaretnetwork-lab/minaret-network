"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, LocateFixed, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function HeroSearch() {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState("");
  const router = useRouter();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (location.trim()) params.set("location", location.trim());
    router.push(`/professionals${params.size ? `?${params}` : ""}`);
  }

  async function detectLocation() {
    if (!("geolocation" in navigator)) {
      setLocateError("Location not supported by your browser.");
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

          // Pick the most specific useful place name
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
          } else {
            setLocateError("Couldn't determine your city. Please type it in.");
          }
        } catch {
          setLocateError("Couldn't look up your location. Please type it in.");
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        setLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setLocateError("Location permission denied. Please type your city.");
        } else {
          setLocateError("Couldn't get your location. Please type your city.");
        }
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  }

  return (
    <div className="w-full max-w-2xl space-y-2">
      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
        {/* Keyword search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40 pointer-events-none" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by service, category, or name"
            className="pl-11 h-12 text-base border-white/30 bg-white/10 text-white placeholder:text-white/40 focus-visible:ring-white focus-visible:border-white backdrop-blur"
          />
        </div>

        {/* Free-text location */}
        <div className="relative sm:w-52">
          <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40 pointer-events-none z-10" />
          <input
            type="text"
            value={location}
            onChange={(e) => { setLocation(e.target.value); setLocateError(""); }}
            placeholder="City or area"
            className="w-full h-12 pl-11 pr-8 rounded-lg text-base border border-white/30 bg-white/10 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white backdrop-blur"
          />
          {location && (
            <button
              type="button"
              onClick={() => setLocation("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <Button
          type="submit"
          size="lg"
          className="h-12 bg-white text-emerald-900 hover:bg-emerald-50 font-semibold px-8 flex-shrink-0"
        >
          Find
        </Button>
      </form>

      {/* GPS detect row */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={detectLocation}
          disabled={locating}
          className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white/80 transition-colors disabled:opacity-40"
        >
          {locating
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
            : <LocateFixed className="h-3.5 w-3.5" />
          }
          {locating ? "Detecting your location…" : "Use my location"}
        </button>
        {locateError && (
          <span className="text-xs text-amber-300/80">{locateError}</span>
        )}
      </div>
    </div>
  );
}
