export type AreaConfig = {
  dbSlug: string;
  urlSlug: string;
  displayName: string;
  city: string;
  province: string;
  lat?: number;
  lng?: number;
};

export const AREA_CONFIG: AreaConfig[] = [
  { dbSlug: "ajax", urlSlug: "ajax", displayName: "Ajax", city: "Ajax", province: "ON", lat: 43.8509, lng: -79.0204 },
  { dbSlug: "aurora", urlSlug: "aurora", displayName: "Aurora", city: "Aurora", province: "ON", lat: 44.0042, lng: -79.4503 },
  { dbSlug: "barrie", urlSlug: "barrie", displayName: "Barrie", city: "Barrie", province: "ON", lat: 44.3894, lng: -79.6903 },
  { dbSlug: "bradford", urlSlug: "bradford", displayName: "Bradford", city: "Bradford", province: "ON", lat: 44.1167, lng: -79.5667 },
  { dbSlug: "brampton", urlSlug: "brampton", displayName: "Brampton", city: "Brampton", province: "ON", lat: 43.7315, lng: -79.7624 },
  { dbSlug: "brantford", urlSlug: "brantford", displayName: "Brantford", city: "Brantford", province: "ON", lat: 43.1394, lng: -80.2644 },
  { dbSlug: "burlington", urlSlug: "burlington", displayName: "Burlington", city: "Burlington", province: "ON", lat: 43.3255, lng: -79.7990 },
  { dbSlug: "cambridge", urlSlug: "cambridge", displayName: "Cambridge", city: "Cambridge", province: "ON", lat: 43.3616, lng: -80.3144 },
  { dbSlug: "clarington", urlSlug: "clarington", displayName: "Clarington", city: "Clarington", province: "ON", lat: 43.9357, lng: -78.6827 },
  { dbSlug: "east-gwillimbury", urlSlug: "east-gwillimbury", displayName: "East Gwillimbury", city: "East Gwillimbury", province: "ON", lat: 44.1350, lng: -79.4514 },
  { dbSlug: "etobicoke", urlSlug: "etobicoke", displayName: "Etobicoke", city: "Toronto", province: "ON", lat: 43.6491, lng: -79.5637 },
  { dbSlug: "georgina", urlSlug: "georgina", displayName: "Georgina", city: "Georgina", province: "ON", lat: 44.2936, lng: -79.4334 },
  { dbSlug: "guelph", urlSlug: "guelph", displayName: "Guelph", city: "Guelph", province: "ON", lat: 43.5448, lng: -80.2482 },
  { dbSlug: "halton-hills", urlSlug: "halton-hills", displayName: "Halton Hills", city: "Halton Hills", province: "ON", lat: 43.6302, lng: -79.9333 },
  { dbSlug: "hamilton", urlSlug: "hamilton", displayName: "Hamilton", city: "Hamilton", province: "ON", lat: 43.2557, lng: -79.8711 },
  { dbSlug: "innisfil", urlSlug: "innisfil", displayName: "Innisfil", city: "Innisfil", province: "ON", lat: 44.1653, lng: -79.6561 },
  { dbSlug: "kawartha-lakes", urlSlug: "kawartha-lakes", displayName: "Kawartha Lakes", city: "Kawartha Lakes", province: "ON", lat: 44.3549, lng: -78.7405 },
  { dbSlug: "keswick", urlSlug: "keswick", displayName: "Keswick", city: "Georgina", province: "ON", lat: 44.2416, lng: -79.4512 },
  { dbSlug: "king", urlSlug: "king", displayName: "King", city: "King", province: "ON", lat: 43.9630, lng: -79.6274 },
  { dbSlug: "kingston", urlSlug: "kingston", displayName: "Kingston", city: "Kingston", province: "ON", lat: 44.2312, lng: -76.4860 },
  { dbSlug: "kitchener", urlSlug: "kitchener", displayName: "Kitchener", city: "Kitchener", province: "ON", lat: 43.4516, lng: -80.4925 },
  { dbSlug: "london", urlSlug: "london", displayName: "London", city: "London", province: "ON", lat: 42.9849, lng: -81.2453 },
  { dbSlug: "markham", urlSlug: "markham", displayName: "Markham", city: "Markham", province: "ON", lat: 43.8561, lng: -79.3370 },
  { dbSlug: "milton", urlSlug: "milton", displayName: "Milton", city: "Milton", province: "ON", lat: 43.5083, lng: -79.8831 },
  { dbSlug: "mississauga", urlSlug: "mississauga", displayName: "Mississauga", city: "Mississauga", province: "ON", lat: 43.5890, lng: -79.6441 },
  { dbSlug: "newmarket", urlSlug: "newmarket", displayName: "Newmarket", city: "Newmarket", province: "ON", lat: 44.0593, lng: -79.4617 },
  { dbSlug: "niagara-falls", urlSlug: "niagara-falls", displayName: "Niagara Falls", city: "Niagara Falls", province: "ON", lat: 43.0896, lng: -79.0849 },
  { dbSlug: "north-york", urlSlug: "north-york", displayName: "North York", city: "Toronto", province: "ON", lat: 43.7615, lng: -79.4111 },
  { dbSlug: "oakville", urlSlug: "oakville", displayName: "Oakville", city: "Oakville", province: "ON", lat: 43.4675, lng: -79.6877 },
  { dbSlug: "orangeville", urlSlug: "orangeville", displayName: "Orangeville", city: "Orangeville", province: "ON", lat: 43.9198, lng: -80.0941 },
  { dbSlug: "oshawa", urlSlug: "oshawa", displayName: "Oshawa", city: "Oshawa", province: "ON", lat: 43.8971, lng: -78.8658 },
  { dbSlug: "ottawa", urlSlug: "ottawa", displayName: "Ottawa", city: "Ottawa", province: "ON", lat: 45.4215, lng: -75.6972 },
  { dbSlug: "peel-region", urlSlug: "peel-region", displayName: "Peel Region", city: "Brampton", province: "ON", lat: 43.7315, lng: -79.7624 },
  { dbSlug: "pickering", urlSlug: "pickering", displayName: "Pickering", city: "Pickering", province: "ON", lat: 43.8384, lng: -79.0868 },
  { dbSlug: "richmond-hill", urlSlug: "richmond-hill", displayName: "Richmond Hill", city: "Richmond Hill", province: "ON", lat: 43.8828, lng: -79.4403 },
  { dbSlug: "sarnia", urlSlug: "sarnia", displayName: "Sarnia", city: "Sarnia", province: "ON", lat: 42.9994, lng: -82.3089 },
  { dbSlug: "scarborough", urlSlug: "scarborough", displayName: "Scarborough", city: "Toronto", province: "ON", lat: 43.7764, lng: -79.2318 },
  { dbSlug: "st-catharines", urlSlug: "st-catharines", displayName: "St. Catharines", city: "St. Catharines", province: "ON", lat: 43.1594, lng: -79.2469 },
  { dbSlug: "stouffville", urlSlug: "stouffville", displayName: "Stouffville", city: "Whitchurch-Stouffville", province: "ON", lat: 43.9714, lng: -79.2494 },
  { dbSlug: "thornhill", urlSlug: "thornhill", displayName: "Thornhill", city: "Markham / Vaughan", province: "ON", lat: 43.8090, lng: -79.4263 },
  { dbSlug: "toronto", urlSlug: "toronto", displayName: "Toronto", city: "Toronto", province: "ON", lat: 43.6532, lng: -79.3832 },
  { dbSlug: "uxbridge", urlSlug: "uxbridge", displayName: "Uxbridge", city: "Uxbridge", province: "ON", lat: 44.1075, lng: -79.1246 },
  { dbSlug: "vaughan", urlSlug: "vaughan", displayName: "Vaughan", city: "Vaughan", province: "ON", lat: 43.8361, lng: -79.4980 },
  { dbSlug: "waterloo", urlSlug: "waterloo", displayName: "Waterloo", city: "Waterloo", province: "ON", lat: 43.4668, lng: -80.5164 },
  { dbSlug: "whitby", urlSlug: "whitby", displayName: "Whitby", city: "Whitby", province: "ON", lat: 43.8975, lng: -78.9429 },
  { dbSlug: "whitchurch-stouffville", urlSlug: "whitchurch-stouffville", displayName: "Whitchurch-Stouffville", city: "Whitchurch-Stouffville", province: "ON", lat: 43.9714, lng: -79.2494 },
  { dbSlug: "windsor", urlSlug: "windsor", displayName: "Windsor", city: "Windsor", province: "ON", lat: 42.3149, lng: -83.0364 },
  { dbSlug: "woodbridge", urlSlug: "woodbridge", displayName: "Woodbridge", city: "Vaughan", province: "ON", lat: 43.7863, lng: -79.5966 },
  { dbSlug: "york", urlSlug: "york", displayName: "York", city: "Toronto", province: "ON", lat: 43.6946, lng: -79.4700 },
];

export const AREA_BY_URL_SLUG = new Map(AREA_CONFIG.map((a) => [a.urlSlug, a]));
export const AREA_BY_DB_SLUG = new Map(AREA_CONFIG.map((a) => [a.dbSlug, a]));
export const VALID_AREA_URL_SLUGS = new Set(AREA_CONFIG.map((a) => a.urlSlug));
