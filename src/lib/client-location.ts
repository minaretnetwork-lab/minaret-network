const DETECTED_CITY_CACHE_KEY = "minaret:detected-city";
const DETECTED_CITY_MAX_AGE_MS = 5 * 60 * 1000;

type CachedCity = {
  city: string;
  detectedAt: number;
};

// City-level lookup does not need a fresh GPS-quality fix. Allow the browser
// to reuse a recent network/Wi-Fi position, which is substantially faster on
// mobile devices and uses less power.
export const CITY_POSITION_OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  maximumAge: DETECTED_CITY_MAX_AGE_MS,
  // The browser permission prompt can consume several seconds on the first
  // request, so allow enough time for the user to respond.
  timeout: 15000,
};

export function getCachedDetectedCity() {
  try {
    const raw = sessionStorage.getItem(DETECTED_CITY_CACHE_KEY);
    if (!raw) return null;

    const cached = JSON.parse(raw) as Partial<CachedCity>;
    const city = typeof cached.city === "string" ? cached.city.trim() : "";
    const age = typeof cached.detectedAt === "number"
      ? Date.now() - cached.detectedAt
      : Number.NaN;
    if (
      city.length > 0 &&
      age >= 0 &&
      age <= DETECTED_CITY_MAX_AGE_MS
    ) {
      return city;
    }

    sessionStorage.removeItem(DETECTED_CITY_CACHE_KEY);
  } catch {
    // Storage can be unavailable in privacy-restricted browser contexts.
  }

  return null;
}

export function cacheDetectedCity(city: string) {
  try {
    const normalizedCity = city.trim();
    if (!normalizedCity) return;

    const cached: CachedCity = { city: normalizedCity, detectedAt: Date.now() };
    sessionStorage.setItem(DETECTED_CITY_CACHE_KEY, JSON.stringify(cached));
  } catch {
    // Location detection still works when session storage is unavailable.
  }
}

export function clearCachedDetectedCity() {
  try {
    sessionStorage.removeItem(DETECTED_CITY_CACHE_KEY);
  } catch {
    // Clearing the visible field still works when storage is unavailable.
  }
}
