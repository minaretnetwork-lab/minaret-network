"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Loader2, LocateFixed, MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  cacheDetectedCity,
  CITY_POSITION_OPTIONS,
  clearCachedDetectedCity,
  getCachedDetectedCity,
} from "@/lib/client-location";

export function IncomingDistanceControl({ initialOrigin = "" }: { initialOrigin?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [origin, setOrigin] = useState(initialOrigin);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");

  function updateOrigin(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    const trimmed = value.trim();
    if (trimmed) {
      params.set("origin", trimmed);
    } else {
      params.delete("origin");
    }
    router.replace(params.toString() ? `${pathname}?${params.toString()}` : pathname, { scroll: false });
  }

  function detectLocation() {
    if (!("geolocation" in navigator)) {
      setError("Your browser does not support location detection. Enter a city instead.");
      return;
    }

    const cachedCity = getCachedDetectedCity();
    if (cachedCity) {
      setOrigin(cachedCity);
      updateOrigin(cachedCity);
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
          setOrigin(city);
          updateOrigin(city);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Location lookup failed. Enter a city instead.");
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        setLocating(false);
        setError(
          err.code === err.PERMISSION_DENIED
            ? "Location permission is blocked. Enter a city instead."
            : "Couldn't read your location. Enter a city instead."
        );
      },
      CITY_POSITION_OPTIONS
    );
  }

  return (
    <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 dark:border-emerald-800/40 dark:bg-emerald-900/10">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex-1">
          <p className="font-semibold text-emerald-950 dark:text-emerald-100">Check distance</p>
          <p className="mt-0.5 text-sm text-emerald-800 dark:text-emerald-200">
            Use your current city or enter where you are travelling from.
          </p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
          <div className="relative sm:w-64">
            <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              value={origin}
              onChange={(event) => setOrigin(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") updateOrigin(origin);
              }}
              placeholder="City, e.g. Keswick"
              className="h-10 bg-white pl-9 pr-9 dark:bg-gray-950"
            />
            {origin && (
              <button
                type="button"
                onClick={() => {
                  setOrigin("");
                  updateOrigin("");
                  setError("");
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-600"
                aria-label="Clear distance location"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => updateOrigin(origin)}
            className="h-10 border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50"
          >
            Apply
          </Button>
          <Button
            type="button"
            onClick={detectLocation}
            disabled={locating}
            className="h-10 gap-1.5 bg-emerald-700 text-white hover:bg-emerald-800"
          >
            {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
            Use current
          </Button>
        </div>
      </div>
      {error && <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-700">{error}</p>}
    </div>
  );
}
