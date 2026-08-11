export type ServiceAreaCoordinate = {
  name: string;
  slug: string;
  latitude: number;
  longitude: number;
};

// A compact offline geocoder for the areas the directory actually serves.
// Coordinates are municipal/community centroids and are intentionally not
// precise enough to disclose a user's street-level position.
export const SERVICE_AREA_COORDINATES: ServiceAreaCoordinate[] = [
  { name: "Keswick", slug: "keswick", latitude: 44.2301, longitude: -79.4663 },
  { name: "Sutton", slug: "sutton", latitude: 44.3046, longitude: -79.3581 },
  { name: "Jackson's Point", slug: "jacksons-point", latitude: 44.3211, longitude: -79.3680 },
  { name: "Georgina", slug: "georgina", latitude: 44.2963, longitude: -79.4362 },
  { name: "Newmarket", slug: "newmarket", latitude: 44.0592, longitude: -79.4613 },
  { name: "Aurora", slug: "aurora", latitude: 44.0065, longitude: -79.4504 },
  { name: "East Gwillimbury", slug: "east-gwillimbury", latitude: 44.1009, longitude: -79.4410 },
  { name: "Bradford", slug: "bradford", latitude: 44.1144, longitude: -79.5641 },
  { name: "Richmond Hill", slug: "richmond-hill", latitude: 43.8828, longitude: -79.4403 },
  { name: "Vaughan", slug: "vaughan", latitude: 43.8372, longitude: -79.5083 },
  { name: "Markham", slug: "markham", latitude: 43.8561, longitude: -79.3370 },
  { name: "Stouffville", slug: "stouffville", latitude: 43.9706, longitude: -79.2443 },
  { name: "King City", slug: "king-city", latitude: 43.9287, longitude: -79.5269 },
  { name: "Downtown Toronto", slug: "downtown-toronto", latitude: 43.6532, longitude: -79.3832 },
  { name: "North York", slug: "north-york", latitude: 43.7615, longitude: -79.4111 },
  { name: "Scarborough", slug: "scarborough", latitude: 43.7764, longitude: -79.2318 },
  { name: "Etobicoke", slug: "etobicoke", latitude: 43.6205, longitude: -79.5132 },
  { name: "East York", slug: "east-york", latitude: 43.6912, longitude: -79.3417 },
  { name: "Mississauga", slug: "mississauga", latitude: 43.5890, longitude: -79.6441 },
  { name: "Brampton", slug: "brampton", latitude: 43.7315, longitude: -79.7624 },
  { name: "Caledon", slug: "caledon", latitude: 43.8754, longitude: -79.8583 },
  { name: "Pickering", slug: "pickering", latitude: 43.8384, longitude: -79.0868 },
  { name: "Ajax", slug: "ajax", latitude: 43.8509, longitude: -79.0204 },
  { name: "Whitby", slug: "whitby", latitude: 43.8975, longitude: -78.9429 },
  { name: "Oshawa", slug: "oshawa", latitude: 43.8971, longitude: -78.8658 },
  { name: "Uxbridge", slug: "uxbridge", latitude: 44.1094, longitude: -79.1205 },
  { name: "Oakville", slug: "oakville", latitude: 43.4675, longitude: -79.6877 },
  { name: "Burlington", slug: "burlington", latitude: 43.3255, longitude: -79.7990 },
  { name: "Milton", slug: "milton", latitude: 43.5183, longitude: -79.8774 },
  { name: "Hamilton", slug: "hamilton", latitude: 43.2557, longitude: -79.8711 },
  { name: "Barrie", slug: "barrie", latitude: 44.3894, longitude: -79.6903 },
];

export function distanceInKilometres(
  latitudeA: number,
  longitudeA: number,
  latitudeB: number,
  longitudeB: number,
) {
  const earthRadiusKm = 6371;
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const latitudeDelta = toRadians(latitudeB - latitudeA);
  const longitudeDelta = toRadians(longitudeB - longitudeA);
  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(toRadians(latitudeA)) *
      Math.cos(toRadians(latitudeB)) *
      Math.sin(longitudeDelta / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function findServiceAreaCoordinateBySlug(slug: string | null | undefined) {
  if (!slug) return null;
  return SERVICE_AREA_COORDINATES.find((area) => area.slug === slug) ?? null;
}

export function findServiceAreaCoordinateByName(name: string | null | undefined) {
  const normalized = name?.toLowerCase().trim();
  if (!normalized) return null;

  return (
    SERVICE_AREA_COORDINATES.find((area) => area.name.toLowerCase() === normalized || area.slug === normalized) ??
    SERVICE_AREA_COORDINATES.find((area) => normalized.includes(area.name.toLowerCase()) || area.name.toLowerCase().includes(normalized)) ??
    null
  );
}

export function distanceBetweenServiceAreas(
  origin: ServiceAreaCoordinate,
  destination: Pick<ServiceAreaCoordinate, "latitude" | "longitude">,
) {
  return distanceInKilometres(
    origin.latitude,
    origin.longitude,
    destination.latitude,
    destination.longitude,
  );
}

export function findNearestServiceArea(latitude: number, longitude: number) {
  const nearest = SERVICE_AREA_COORDINATES.reduce<{
    area: ServiceAreaCoordinate;
    distanceKm: number;
  } | null>((best, area) => {
    const distanceKm = distanceInKilometres(
      latitude,
      longitude,
      area.latitude,
      area.longitude,
    );
    return !best || distanceKm < best.distanceKm ? { area, distanceKm } : best;
  }, null);

  // Avoid confidently assigning an unrelated Ontario municipality.
  return nearest && nearest.distanceKm <= 60 ? nearest : null;
}
