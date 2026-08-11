"use server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import type { SearchFilters } from "@/types";
import {
  distanceBetweenServiceAreas,
  findServiceAreaCoordinateByName,
  findServiceAreaCoordinateBySlug,
} from "@/lib/service-area-coordinates";
import { normalizePublicAssetUrl } from "@/lib/public-asset-url";

async function uploadToStorage(bucket: string, path: string, file: File): Promise<string> {
  const admin = createAdminClient();
  const { error: bucketErr } = await admin.storage.createBucket(bucket, {
    public: true,
    fileSizeLimit: 5242880,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  });
  if (bucketErr && !bucketErr.message.includes("already exists")) throw bucketErr;
  const { error: uploadErr } = await admin.storage
    .from(bucket)
    .upload(path, file, { upsert: true, contentType: file.type });
  if (uploadErr) throw uploadErr;
  const { data } = admin.storage.from(bucket).getPublicUrl(path);
  return `${normalizePublicAssetUrl(data.publicUrl)}?t=${Date.now()}`;
}

function normalizeProfessionalAssets<T extends { photoUrl: string | null; logoUrl?: string | null }>(professional: T): T {
  return {
    ...professional,
    photoUrl: normalizePublicAssetUrl(professional.photoUrl),
    ...(Object.hasOwn(professional, "logoUrl") && {
      logoUrl: normalizePublicAssetUrl(professional.logoUrl),
    }),
  };
}

export async function getProfessionals(
  mosqueSlug: string,
  filters: SearchFilters = {}
) {
  const { query, categorySlug, serviceAreaSlug, locationText, languages, gender, verifiedOnly, affiliatedMosqueSlug, sortBy } = filters;

  const mosque = await prisma.mosque.findUnique({ where: { slug: mosqueSlug } });
  if (!mosque) return [];

  // Location filter: slug takes precedence (sidebar), else free-text from GPS/hero
  const areaFilter = serviceAreaSlug
    ? { serviceAreas: { some: { slug: serviceAreaSlug } } }
    : locationText
    ? { serviceAreas: { some: { name: { contains: locationText, mode: "insensitive" } } } }
    : {};

  const where: Record<string, unknown> = {
    mosqueId: mosque.id,
    status: "APPROVED",
    ...(categorySlug && { category: { slug: categorySlug } }),
    ...areaFilter,
    ...(gender && { gender }),
    ...(verifiedOnly && { badges: { some: { type: "MOSQUE_AFFILIATED" } } }),
    ...(affiliatedMosqueSlug && {
      mosque: { slug: affiliatedMosqueSlug },
      badges: { some: { type: "MOSQUE_AFFILIATED" } },
    }),
    ...(languages && languages.length > 0 && {
      languages: { hasSome: languages },
    }),
    ...(query && {
      OR: [
        { category: { name: { contains: query, mode: "insensitive" } } },
        { user: { firstName: { contains: query, mode: "insensitive" } } },
        { user: { lastName: { contains: query, mode: "insensitive" } } },
        { user: { displayName: { contains: query, mode: "insensitive" } } },
        { businessName: { contains: query, mode: "insensitive" } },
      ],
    }),
  };

  const orderBy: Record<string, unknown>[] =
    sortBy === "alphabetical"
      ? [{ user: { firstName: "asc" } }]
      : sortBy === "newest"
      ? [{ approvedAt: "desc" }]
      : [{ isSponsored: "desc" }, { recommendations: { _count: "desc" } }, { isFeatured: "desc" }];

  const include = {
    user: { select: { id: true, firstName: true, lastName: true, displayName: true, email: true, avatarUrl: true } },
    mosque: { select: { id: true, name: true, slug: true } },
    category: { select: { id: true, name: true, slug: true, icon: true } },
    serviceAreas: { select: { id: true, name: true, slug: true } },
    badges: { select: { id: true, type: true, issuedAt: true } },
    recommendations: { where: { status: "APPROVED" }, select: { id: true, status: true, rating: true } },
    galleryImages: { select: { id: true, url: true, caption: true }, take: 6 },
  } satisfies Prisma.ProfessionalInclude;

  const professionals = await prisma.professional.findMany({
    where,
    orderBy,
    include,
  });
  const normalizedProfessionals = professionals.map(normalizeProfessionalAssets);

  const locationWasRequested = Boolean(serviceAreaSlug || locationText);
  if (normalizedProfessionals.length > 0 || !locationWasRequested) return normalizedProfessionals;

  const origin =
    findServiceAreaCoordinateBySlug(serviceAreaSlug) ??
    findServiceAreaCoordinateByName(locationText);

  if (!origin) return normalizedProfessionals;

  const fallbackWhere = {
    ...where,
    serviceAreas: undefined,
  };
  delete fallbackWhere.serviceAreas;

  const fallbackProfessionals = await prisma.professional.findMany({
    where: fallbackWhere,
    orderBy,
    include,
  });

  return fallbackProfessionals
    .map(normalizeProfessionalAssets)
    .map((professional) => {
      const nearest = professional.serviceAreas.reduce<{
        distanceKm: number;
        areaName: string;
      } | null>((best, area) => {
        const coordinate = findServiceAreaCoordinateBySlug(area.slug) ?? findServiceAreaCoordinateByName(area.name);
        if (!coordinate) return best;
        const distanceKm = distanceBetweenServiceAreas(origin, coordinate);
        return !best || distanceKm < best.distanceKm ? { distanceKm, areaName: area.name } : best;
      }, null);

      return {
        ...professional,
        fallbackDistanceKm: nearest ? Math.round(nearest.distanceKm * 10) / 10 : null,
        fallbackDistanceArea: nearest?.areaName ?? null,
        isLocationFallback: true,
      };
    })
    .sort((a, b) => {
      const distanceA = a.fallbackDistanceKm ?? Number.POSITIVE_INFINITY;
      const distanceB = b.fallbackDistanceKm ?? Number.POSITIVE_INFINITY;
      if (distanceA !== distanceB) return distanceA - distanceB;
      if (a.isSponsored !== b.isSponsored) return a.isSponsored ? -1 : 1;
      if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
      return b.recommendations.length - a.recommendations.length;
    });
}

export async function getProfessionalById(id: string) {
  const professional = await prisma.professional.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, displayName: true, email: true, avatarUrl: true } },
      mosque: { select: { id: true, name: true, slug: true } },
      category: true,
      serviceAreas: true,
      badges: true,
      recommendations: {
        where: { status: "APPROVED" },
        include: { user: { select: { firstName: true, lastName: true, displayName: true } } },
        orderBy: { approvedAt: "desc" },
      },
      galleryImages: { orderBy: { sortOrder: "asc" } },
      credentials: { where: { isVerified: true } },
    },
  });

  return professional ? normalizeProfessionalAssets(professional) : null;
}

export async function getFeaturedProfessionals(mosqueSlug: string, limit = 6) {
  const mosque = await prisma.mosque.findUnique({ where: { slug: mosqueSlug } });
  if (!mosque) return [];

  const professionals = await prisma.professional.findMany({
    where: { mosqueId: mosque.id, status: "APPROVED", isFeatured: true },
    take: limit,
    include: {
      user: { select: { id: true, firstName: true, lastName: true, displayName: true, avatarUrl: true } },
      category: { select: { id: true, name: true, slug: true, icon: true } },
      serviceAreas: { select: { id: true, name: true, slug: true } },
      mosque: { select: { id: true, name: true, slug: true } },
      badges: { select: { id: true, type: true } },
      recommendations: { where: { status: "APPROVED" }, select: { id: true } },
    },
  });

  return professionals.map(normalizeProfessionalAssets);
}

export async function incrementProfileView(professionalId: string) {
  await prisma.professional.update({
    where: { id: professionalId },
    data: { profileViews: { increment: 1 } },
  });
}

export async function submitProfessionalApplication(
  formData: FormData
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "You must be signed in to apply." };

    const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } });
    if (!dbUser) return { ok: false, error: "Your account was not found. Please sign out and back in." };

    const rawMosqueId = formData.get("mosqueId") as string | null;
    const mosqueId = (!rawMosqueId || rawMosqueId === "unlisted") ? null : rawMosqueId;
    const mosque = mosqueId ? await prisma.mosque.findUnique({ where: { id: mosqueId } }) : null;
    if (mosqueId && !mosque) return { ok: false, error: "Selected mosque not found." };

    const categoryId = formData.get("categoryId") as string;
    if (!categoryId) return { ok: false, error: "Please select a category." };

    const languages = formData.getAll("languages") as string[];
    const serviceAreaIds = formData.getAll("serviceAreaIds") as string[];
    const professionalId = crypto.randomUUID();

    const photoFile = formData.get("photo") as File | null;
    const logoFile = formData.get("logo") as File | null;
    let photoUrl: string | null = null;
    let logoUrl: string | null = null;
    if (photoFile && photoFile.size > 0) {
      const ext = photoFile.name.split(".").pop() ?? "jpg";
      photoUrl = await uploadToStorage("professional-photos", `${dbUser.id}/${professionalId}/photo.${ext}`, photoFile);
    }
    if (logoFile && logoFile.size > 0) {
      const ext = logoFile.name.split(".").pop() ?? "png";
      logoUrl = await uploadToStorage("professional-logos", `${dbUser.id}/${professionalId}/logo.${ext}`, logoFile);
    }

    await prisma.professional.create({
      data: {
        id: professionalId,
        userId: dbUser.id,
        mosqueId: mosque?.id ?? null,
        categoryId,
        ...(photoUrl && { photoUrl }),
        ...(logoUrl && { logoUrl }),
        businessName: formData.get("businessName") as string || null,
        title: formData.get("title") as string || null,
        bio: formData.get("bio") as string || null,
        yearsOfExperience: formData.get("yearsOfExperience") ? Number(formData.get("yearsOfExperience")) : null,
        qualifications: formData.get("qualifications") as string || null,
        licenses: formData.get("licenses") as string || null,
        languages,
        phone: formData.get("phone") as string || null,
        email: formData.get("email") as string || null,
        website: formData.get("website") as string || null,
        whatsapp: formData.get("whatsapp") as string || null,
        availability: formData.get("availability") as string || null,
        serviceAreas: { connect: serviceAreaIds.map((id) => ({ id })) },
      },
    });

    revalidatePath("/dashboard");
    return { ok: true };
  } catch (err) {
    console.error("submitProfessionalApplication:", err);
    const message = err instanceof Error ? err.message : "An unexpected error occurred.";
    return { ok: false, error: message };
  }
}
