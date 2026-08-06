import { findNearestServiceArea } from "@/lib/service-area-coordinates";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const latitude = Number(searchParams.get("lat"));
  const longitude = Number(searchParams.get("lon"));

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return Response.json({ error: "Valid latitude and longitude are required." }, { status: 400 });
  }

  const nominatimUrl = process.env.NOMINATIM_URL;
  if (nominatimUrl) {
    try {
      const endpoint = new URL("reverse", `${nominatimUrl.replace(/\/$/, "")}/`);
      endpoint.searchParams.set("lat", String(latitude));
      endpoint.searchParams.set("lon", String(longitude));
      endpoint.searchParams.set("format", "jsonv2");
      endpoint.searchParams.set("accept-language", "en");

      const response = await fetch(endpoint, {
        headers: { "User-Agent": "MinaretNetwork/experiment-local-geocoder" },
        signal: AbortSignal.timeout(5000),
      });
      if (response.ok) {
        const data = await response.json();
        const city =
          data.address?.city ??
          data.address?.town ??
          data.address?.village ??
          data.address?.municipality ??
          data.address?.suburb;
        if (city) {
          return Response.json({ city, source: "local-nominatim" });
        }
      }
    } catch {
      // The local Ontario import can take a while on first start. Fall back to
      // the bundled service-area centroids while it is unavailable.
    }
  }

  const nearest = findNearestServiceArea(latitude, longitude);
  if (!nearest) {
    return Response.json(
      { error: "Your location is outside the currently supported service area." },
      { status: 404 },
    );
  }

  return Response.json({
    city: nearest.area.name,
    slug: nearest.area.slug,
    distanceKm: Math.round(nearest.distanceKm * 10) / 10,
    source: "bundled-service-areas",
  });
}
