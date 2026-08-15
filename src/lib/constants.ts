export const DEFAULT_MOSQUE_SLUG =
  process.env.NEXT_PUBLIC_DEFAULT_MOSQUE_SLUG ?? "al-falah";

// Bump this whenever Terms of Service or Privacy Policy materially changes.
// Users whose stored tosVersion !== CURRENT_TOS_VERSION are redirected to re-accept before using the app.
export const CURRENT_TOS_VERSION = "1.0";

// Identifies the small set of legacy listings paused before explicit listing
// and mosque-affiliation consent was collected. Keep this exact so ordinary
// admin suspensions can never be restored by the self-service consent flow.
export const LEGACY_LISTING_CONSENT_SUSPENSION_REASON =
  "Temporarily disabled on August 15, 2026 pending mosque affiliation consent verification.";

// After consent is collected from the paused August 15, 2026 cohort, keep the
// listing live again while preserving an audit note about the restoration.
export const LEGACY_LISTING_CONSENT_RECEIVED_REASON =
  "Consent received on August 15, 2026. Listing restored to live status.";

export const CONSENT_HOST = "consent.minaretnetwork.ca";
export const CONSENT_FLOW_PATH = "/auth/re-consent?source=listing-restoration";
export const CONSENT_COMPLETE_PATH = "/auth/re-consent/complete";

// Bump this whenever the broadcast consent disclosure wording materially changes.
// Stored on each service request so we can tell which users saw which version.
export const CURRENT_BROADCAST_CONSENT_VERSION = "1.0";

export const CATEGORIES = [
  // Healthcare
  { name: "Doctor", slug: "doctor", icon: "🩺" },
  { name: "Dentist", slug: "dentist", icon: "🦷" },
  { name: "Pharmacist", slug: "pharmacist", icon: "💊" },
  { name: "Physiotherapist", slug: "physiotherapist", icon: "🏥" },
  { name: "Chiropractor", slug: "chiropractor", icon: "🦴" },
  { name: "Optometrist", slug: "optometrist", icon: "👁️" },
  { name: "Counsellor", slug: "counsellor", icon: "🧠" },
  // Legal & Financial
  { name: "Lawyer", slug: "lawyer", icon: "⚖️" },
  { name: "Immigration Consultant", slug: "immigration-consultant", icon: "🌍" },
  { name: "Notary Public", slug: "notary-public", icon: "📜" },
  { name: "Accountant", slug: "accountant", icon: "📊" },
  { name: "Financial Advisor", slug: "financial-advisor", icon: "💼" },
  { name: "Insurance Broker", slug: "insurance-broker", icon: "🛡️" },
  { name: "Mortgage Broker", slug: "mortgage-broker", icon: "🏦" },
  { name: "Realtor", slug: "realtor", icon: "🏠" },
  // Home Services & Trades
  { name: "Contractor", slug: "contractor", icon: "🏗️" },
  { name: "Handyman", slug: "handyman", icon: "🔨" },
  { name: "Electrician", slug: "electrician", icon: "⚡" },
  { name: "Plumber", slug: "plumber", icon: "🔧" },
  { name: "HVAC", slug: "hvac", icon: "❄️" },
  { name: "Roofer", slug: "roofer", icon: "🏚️" },
  { name: "Painter", slug: "painter", icon: "🖌️" },
  { name: "Flooring", slug: "flooring", icon: "🪵" },
  { name: "Landscaper", slug: "landscaper", icon: "🌿" },
  { name: "Snow Removal", slug: "snow-removal", icon: "❄️" },
  { name: "Home Inspector", slug: "home-inspector", icon: "🔍" },
  { name: "Moving Services", slug: "moving-services", icon: "🚛" },
  { name: "Pest Control", slug: "pest-control", icon: "🐛" },
  { name: "Appliance Repair", slug: "appliance-repair", icon: "🔌" },
  { name: "Cleaning Services", slug: "cleaning-services", icon: "🧹" },
  // Auto
  { name: "Mechanic", slug: "mechanic", icon: "🔩" },
  { name: "Car Dealership", slug: "car-dealership", icon: "🚘" },
  { name: "Car Rental", slug: "car-rental", icon: "🔑" },
  { name: "Auto Body Shop", slug: "auto-body-shop", icon: "🛠️" },
  // Education & Coaching
  { name: "Tutor", slug: "tutor", icon: "📚" },
  { name: "Driving Instructor", slug: "driving-instructor", icon: "🚗" },
  { name: "Personal Trainer", slug: "personal-trainer", icon: "💪" },
  // Technology & Creative
  { name: "IT Consultant", slug: "it-consultant", icon: "💻" },
  { name: "Web Developer", slug: "web-developer", icon: "🌐" },
  { name: "Graphic Designer", slug: "graphic-designer", icon: "🎨" },
  { name: "Photographer", slug: "photographer", icon: "📷" },
  { name: "Videographer", slug: "videographer", icon: "🎬" },
  // Lifestyle & Events
  { name: "Tailor / Alterations", slug: "tailor-alterations", icon: "🧵" },
  { name: "Barber / Hair Stylist", slug: "barber-hair-stylist", icon: "✂️" },
  { name: "Event & Wedding Planner", slug: "event-wedding-planner", icon: "💍" },
  { name: "Restaurant / Catering", slug: "restaurant-catering", icon: "🍽️" },
  { name: "Pet Sitter", slug: "pet-sitter", icon: "🐾" },
  // Business
  { name: "Business Consultant", slug: "business-consultant", icon: "📈" },
  { name: "Travel Agent", slug: "travel-agent", icon: "✈️" },
  { name: "Childcare", slug: "childcare", icon: "👶" },
] as const;

export const LANGUAGES = [
  "English",
  "Arabic",
  "Urdu",
  "French",
  "Punjabi",
  "Somali",
  "Bengali",
  "Pashto",
  "Persian/Farsi",
  "Turkish",
  "Swahili",
  "Hausa",
  "Malay",
  "Indonesian",
  "Other",
];

export const SERVICE_AREAS = [
  // Georgina / Lake Simcoe
  { name: "Keswick", slug: "keswick" },
  { name: "Sutton", slug: "sutton" },
  { name: "Jackson's Point", slug: "jacksons-point" },
  { name: "Georgina", slug: "georgina" },
  // York Region
  { name: "Newmarket", slug: "newmarket" },
  { name: "Aurora", slug: "aurora" },
  { name: "East Gwillimbury", slug: "east-gwillimbury" },
  { name: "Bradford", slug: "bradford" },
  { name: "Richmond Hill", slug: "richmond-hill" },
  { name: "Vaughan", slug: "vaughan" },
  { name: "Markham", slug: "markham" },
  { name: "Stouffville", slug: "stouffville" },
  { name: "King City", slug: "king-city" },
  // Toronto
  { name: "Downtown Toronto", slug: "downtown-toronto" },
  { name: "North York", slug: "north-york" },
  { name: "Scarborough", slug: "scarborough" },
  { name: "Etobicoke", slug: "etobicoke" },
  { name: "East York", slug: "east-york" },
  // Peel Region
  { name: "Mississauga", slug: "mississauga" },
  { name: "Brampton", slug: "brampton" },
  { name: "Caledon", slug: "caledon" },
  // Durham Region
  { name: "Pickering", slug: "pickering" },
  { name: "Ajax", slug: "ajax" },
  { name: "Whitby", slug: "whitby" },
  { name: "Oshawa", slug: "oshawa" },
  { name: "Uxbridge", slug: "uxbridge" },
  // Halton Region
  { name: "Oakville", slug: "oakville" },
  { name: "Burlington", slug: "burlington" },
  { name: "Milton", slug: "milton" },
  // Beyond GTA
  { name: "Hamilton", slug: "hamilton" },
  { name: "Barrie", slug: "barrie" },
];

export const BADGE_LABELS: Record<string, string> = {
  MOSQUE_AFFILIATED: "Mosque Affiliated",
  HIGHLY_RECOMMENDED: "Highly Recommended",
};

export const BADGE_COLORS: Record<string, string> = {
  MOSQUE_AFFILIATED: "bg-green-100 text-green-700 border-green-200",
  HIGHLY_RECOMMENDED: "bg-amber-100 text-amber-700 border-amber-200",
};
