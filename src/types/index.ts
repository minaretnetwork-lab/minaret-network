export type UserRole = "MEMBER" | "PROFESSIONAL" | "ADMIN" | "SUPER_ADMIN";
export type ProfessionalStatus = "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
export type BadgeType = "MOSQUE_AFFILIATED" | "HIGHLY_RECOMMENDED";
export type RecommendationStatus = "PENDING" | "APPROVED" | "REJECTED";
export type RequestStatus = "OPEN" | "IN_PROGRESS" | "CLOSED" | "CANCELLED";
export type ContactMethod = "EMAIL" | "PHONE" | "WHATSAPP";
export type Gender = "MALE" | "FEMALE" | "PREFER_NOT_TO_SAY";

export interface ProfessionalWithRelations {
  id: string;
  userId: string;
  mosqueId: string;
  categoryId: string;
  businessName: string | null;
  title: string | null;
  bio: string | null;
  yearsOfExperience: number | null;
  qualifications: string | null;
  licenses: string | null;
  languages: string[];
  gender: Gender | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  whatsapp: string | null;
  photoUrl: string | null;
  status: ProfessionalStatus;
  isVerified: boolean;
  isFeatured: boolean;
  isSponsored: boolean;
  profileViews: number;
  searchAppearances: number;
  contactClicks: number;
  availability: string | null;
  approvedAt: Date | null;
  createdAt: Date;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    displayName: string | null;
    email: string;
    avatarUrl: string | null;
  };
  mosque: { id: string; name: string; slug: string } | null;
  category: {
    id: string;
    name: string;
    slug: string;
    icon: string | null;
  };
  serviceAreas: { id: string; name: string; slug: string }[];
  badges: { id: string; type: BadgeType; issuedAt: Date }[];
  recommendations: { id: string; status: RecommendationStatus; rating: number }[];
  galleryImages: { id: string; url: string; caption: string | null }[];
  isLocationFallback?: boolean;
  fallbackDistanceKm?: number | null;
  fallbackDistanceArea?: string | null;
}

export interface SearchFilters {
  query?: string;
  categorySlug?: string;
  serviceAreaSlug?: string;
  locationText?: string;
  languages?: string[];
  gender?: Gender;
  verifiedOnly?: boolean;
  affiliatedMosqueSlug?: string;
  sortBy?: "recommended" | "newest" | "alphabetical";
}
