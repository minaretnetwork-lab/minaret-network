type NominatimSearchResult = {
  display_name?: string;
  lat?: string;
  lon?: string;
  address?: {
    house_number?: string;
    road?: string;
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    suburb?: string;
    state?: string;
    province?: string;
    postcode?: string;
    country?: string;
  };
};

type AddressSuggestion = {
  label: string;
  address: string;
  city: string | null;
  province: string | null;
  lat: number | null;
  lon: number | null;
};

const CACHE_TTL_MS = 10 * 60 * 1000;
const cache = new Map<string, { expiresAt: number; suggestions: AddressSuggestion[] }>();

function getLeadingHouseNumber(query: string) {
  return query.match(/^\s*([0-9]+[A-Za-z]?(?:[-/][0-9A-Za-z]+)?)\b/)?.[1] ?? null;
}

function compactAddress(result: NominatimSearchResult, fallbackHouseNumber: string | null) {
  const address = result.address ?? {};
  const houseNumber = address.house_number ?? fallbackHouseNumber ?? undefined;
  const street = [houseNumber, address.road].filter(Boolean).join(" ");
  const city = address.city ?? address.town ?? address.village ?? address.municipality ?? address.suburb;
  const province = address.state ?? address.province;
  const parts = [street, city, province, address.postcode, address.country].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : result.display_name ?? "";
}

function normalizeResult(result: NominatimSearchResult, rawQuery: string): AddressSuggestion | null {
  const label = result.display_name?.trim();
  const fallbackHouseNumber = result.address?.house_number ? null : getLeadingHouseNumber(rawQuery);
  const address = compactAddress(result, fallbackHouseNumber).trim();
  if (!label || !address) return null;

  const city =
    result.address?.city ??
    result.address?.town ??
    result.address?.village ??
    result.address?.municipality ??
    result.address?.suburb ??
    null;
  const province = result.address?.state ?? result.address?.province ?? null;
  const lat = result.lat ? Number(result.lat) : null;
  const lon = result.lon ? Number(result.lon) : null;

  return {
    label,
    address,
    city,
    province,
    lat: Number.isFinite(lat) ? lat : null,
    lon: Number.isFinite(lon) ? lon : null,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawQuery = searchParams.get("q")?.trim() ?? "";

  if (rawQuery.length < 3) {
    return Response.json({ suggestions: [] });
  }

  const query = rawQuery.toLowerCase();
  const cached = cache.get(query);
  if (cached && cached.expiresAt > Date.now()) {
    return Response.json({ suggestions: cached.suggestions });
  }

  const nominatimBase = process.env.NOMINATIM_URL?.replace(/\/$/, "") ?? "https://nominatim.openstreetmap.org";
  const endpoint = new URL("search", `${nominatimBase}/`);
  endpoint.searchParams.set("q", `${rawQuery}, Ontario, Canada`);
  endpoint.searchParams.set("format", "jsonv2");
  endpoint.searchParams.set("addressdetails", "1");
  endpoint.searchParams.set("limit", "6");
  endpoint.searchParams.set("countrycodes", "ca");
  endpoint.searchParams.set("accept-language", "en");
  endpoint.searchParams.set("viewbox", "-80.15,44.55,-78.25,43.25");

  try {
    const response = await fetch(endpoint, {
      headers: {
        "User-Agent": "MinaretNetwork/1.0 address-lookup",
        Referer: process.env.NEXT_PUBLIC_SITE_URL ?? "https://minaretnetwork.ca",
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      console.warn("[geocode-search] Nominatim request failed", response.status, response.statusText);
      return Response.json({ suggestions: [] });
    }

    const data = (await response.json()) as NominatimSearchResult[];
    const seen = new Set<string>();
    const suggestions = data
      .map((result) => normalizeResult(result, rawQuery))
      .filter((suggestion): suggestion is AddressSuggestion => Boolean(suggestion))
      .filter((suggestion) => {
        const key = suggestion.address.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

    cache.set(query, { expiresAt: Date.now() + CACHE_TTL_MS, suggestions });
    return Response.json({ suggestions });
  } catch (error) {
    console.warn("[geocode-search] lookup failed", error);
    return Response.json({ suggestions: [] });
  }
}
