import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { CATEGORY_CONFIG, CATEGORY_BY_DB_SLUG } from "@/lib/seo/category-config";
import { AREA_CONFIG, AREA_BY_DB_SLUG } from "@/lib/seo/area-config";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://minaretnetwork.com";
const MAX_SERVICE_AREAS = 20;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const urls: MetadataRoute.Sitemap = [];

  // Static pages
  urls.push({ url: BASE_URL, lastModified: new Date(), changeFrequency: "weekly", priority: 1 });
  urls.push({ url: `${BASE_URL}/professionals`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 });

  // Category hub pages
  for (const cat of CATEGORY_CONFIG) {
    urls.push({ url: `${BASE_URL}/${cat.urlSlug}`, changeFrequency: "weekly", priority: 0.8 } as MetadataRoute.Sitemap[number]);
  }

  // Area hub pages
  for (const area of AREA_CONFIG) {
    urls.push({ url: `${BASE_URL}/${area.urlSlug}`, changeFrequency: "weekly", priority: 0.7 } as MetadataRoute.Sitemap[number]);
  }

  // Professional profiles
  const professionals = await prisma.professional.findMany({
    where: { status: "APPROVED", profileSlug: { not: null } },
    select: {
      profileSlug: true,
      bio: true,
      updatedAt: true,
      serviceAreas: { select: { slug: true } },
    },
  });

  const qualifiedPros = professionals.filter(
    (p) => p.serviceAreas.length >= 1 && p.serviceAreas.length <= MAX_SERVICE_AREAS && p.bio && p.bio.trim().length > 20
  );

  for (const pro of qualifiedPros) {
    urls.push({
      url: `${BASE_URL}/professional/${pro.profileSlug}`,
      lastModified: pro.updatedAt,
      changeFrequency: "monthly",
      priority: 0.7,
    });
  }

  // Category+area pages — only where at least one professional exists
  const comboSet = new Set<string>();
  for (const pro of qualifiedPros) {
    // We need the category slug — fetch separately below
  }

  const prosWithCategory = await prisma.professional.findMany({
    where: { status: "APPROVED" },
    select: {
      category: { select: { slug: true } },
      serviceAreas: { select: { slug: true } },
      bio: true,
    },
  });

  for (const pro of prosWithCategory) {
    if (!pro.bio || pro.bio.trim().length <= 20) continue;
    if (pro.serviceAreas.length < 1 || pro.serviceAreas.length > MAX_SERVICE_AREAS) continue;
    const catConfig = CATEGORY_BY_DB_SLUG.get(pro.category.slug);
    if (!catConfig) continue;
    for (const area of pro.serviceAreas) {
      const areaConfig = AREA_BY_DB_SLUG.get(area.slug);
      if (!areaConfig) continue;
      comboSet.add(`${catConfig.urlSlug}/${areaConfig.urlSlug}`);
    }
  }

  for (const combo of comboSet) {
    urls.push({ url: `${BASE_URL}/${combo}`, changeFrequency: "weekly", priority: 0.6 });
  }

  return urls;
}
