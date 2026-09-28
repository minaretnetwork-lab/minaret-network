import {
  findNearestServiceArea,
  findServiceAreaCoordinateByName,
} from "@/lib/service-area-coordinates";

const noStore = { "Cache-Control": "private, no-store" };

export function GET(request: Request) {
  const country = request.headers.get("x-vercel-ip-country");
  const region = request.headers.get("x-vercel-ip-country-region");
  if (country !== "CA" || (region && region !== "ON")) {
    return Response.json({ error: "No nearby city could be estimated." }, { status: 404, headers: noStore });
  }

  const latitudeHeader = request.headers.get("x-vercel-ip-latitude");
  const longitudeHeader = request.headers.get("x-vercel-ip-longitude");
  const latitude = latitudeHeader === null ? NaN : Number(latitudeHeader);
  const longitude = longitudeHeader === null ? NaN : Number(longitudeHeader);
  const hasCoordinates = Number.isFinite(latitude) && Number.isFinite(longitude);
  const nearest = hasCoordinates
    ? findNearestServiceArea(latitude, longitude)
    : null;

  let city = nearest?.area.name;
  if (!city && !hasCoordinates && region === "ON") {
    try {
      const reportedCity = decodeURIComponent(request.headers.get("x-vercel-ip-city") ?? "");
      city = findServiceAreaCoordinateByName(reportedCity)?.name;
    } catch {
      // The network city is optional and may not be URL encoded correctly.
    }
  }

  if (!city) {
    return Response.json({ error: "No nearby city could be estimated." }, { status: 404, headers: noStore });
  }

  return Response.json({ city, approximate: true }, { headers: noStore });
}
