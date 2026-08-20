"use server";

import { prisma } from "@/lib/prisma";

// Featured/sponsored listings are free until Nov 1 2026.
// A listing started before this date contributes $0 to MRR.
const PROMO_END = new Date("2026-11-01T00:00:00.000Z");
function effectivePrice(priceMonthly: unknown, startDate: Date | null): number {
  if (!startDate || startDate < PROMO_END) return 0;
  return Number(priceMonthly);
}

export async function getMosqueRevenue(mosqueId: string) {
  const [mosque, sponsored, featured] = await Promise.all([
    prisma.mosque.findUnique({
      where: { id: mosqueId },
      select: { id: true, name: true, city: true },
    }),
    prisma.sponsoredListing.findMany({
      where: {
        status: "ACTIVE",
        professional: { mosqueId },
      },
      select: {
        id: true,
        priceMonthly: true,
        startDate: true,
        professional: {
          select: {
            id: true,
            businessName: true,
            title: true,
            user: { select: { firstName: true, lastName: true } },
            category: { select: { name: true } },
          },
        },
      },
    }),
    prisma.featuredListing.findMany({
      where: {
        status: "ACTIVE",
        professional: { mosqueId },
      },
      select: {
        id: true,
        priceMonthly: true,
        city: true,
        startDate: true,
        impressions: true,
        cardClicks: true,
        professional: {
          select: {
            id: true,
            businessName: true,
            title: true,
            user: { select: { firstName: true, lastName: true } },
            category: { select: { name: true } },
          },
        },
      },
    }),
  ]);

  const sponsoredMRR = sponsored.reduce((sum, l) => sum + effectivePrice(l.priceMonthly, l.startDate), 0);
  const featuredMRR = featured.reduce((sum, l) => sum + effectivePrice(l.priceMonthly, l.startDate), 0);

  return {
    mosque,
    sponsored: JSON.parse(JSON.stringify(sponsored)),
    featured: JSON.parse(JSON.stringify(featured)),
    sponsoredMRR,
    featuredMRR,
    totalMRR: sponsoredMRR + featuredMRR,
  };
}

export async function getAllMosquesWithRevenueSummary() {
  const mosques = await prisma.mosque.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      city: true,
      professionals: {
        select: {
          sponsoredListings: {
            where: { status: "ACTIVE" },
            select: { priceMonthly: true, startDate: true },
          },
          featuredListings: {
            where: { status: "ACTIVE" },
            select: { priceMonthly: true, startDate: true },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return mosques.map((m) => {
    const sponsoredMRR = m.professionals.flatMap((p) => p.sponsoredListings).reduce((sum, l) => sum + effectivePrice(l.priceMonthly, l.startDate), 0);
    const featuredMRR = m.professionals.flatMap((p) => p.featuredListings).reduce((sum, l) => sum + effectivePrice(l.priceMonthly, l.startDate), 0);
    return {
      id: m.id,
      name: m.name,
      city: m.city,
      sponsoredCount: m.professionals.reduce((sum, p) => sum + p.sponsoredListings.length, 0),
      featuredCount: m.professionals.reduce((sum, p) => sum + p.featuredListings.length, 0),
      sponsoredMRR,
      featuredMRR,
      totalMRR: sponsoredMRR + featuredMRR,
    };
  });
}
