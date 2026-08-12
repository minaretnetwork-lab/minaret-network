"use server";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

const professionalForAdminInclude = Prisma.validator<Prisma.ProfessionalInclude>()({
  user: { select: { firstName: true, lastName: true, displayName: true, email: true, phone: true, whatsapp: true, preferredContact: true } },
  mosque: { select: { name: true, city: true, address: true, website: true, communityChannelType: true, communityChannelName: true, communityChannelLink: true } },
  category: { select: { id: true, name: true, slug: true, icon: true } },
  serviceAreas: { select: { id: true, name: true }, orderBy: { name: "asc" } },
  editDrafts: { where: { status: "PENDING" }, orderBy: { submittedAt: "desc" }, take: 1 },
  badges: true,
  recommendations: {
    where: { status: "APPROVED" },
    include: { user: { select: { firstName: true, lastName: true, displayName: true, email: true } } },
    orderBy: { approvedAt: "desc" },
  },
  credentials: { orderBy: { uploadedAt: "desc" } },
  galleryImages: { orderBy: { sortOrder: "asc" } },
});

export type ProfessionalForAdmin = Prisma.ProfessionalGetPayload<{ include: typeof professionalForAdminInclude }>;

export async function approveProfessional(id: string) {
  const pendingDraft = await prisma.professionalEditDraft.findFirst({
    where: { professionalId: id, status: "PENDING" },
    select: { id: true, data: true, serviceAreaIds: true },
  });

  if (pendingDraft) {
    await prisma.$transaction([
      prisma.professional.update({
        where: { id },
        data: professionalDataFromDraft(pendingDraft),
      }),
      prisma.professionalEditDraft.update({
        where: { id: pendingDraft.id },
        data: { status: "APPROVED", reviewedAt: new Date(), adminNote: null },
      }),
    ]);
    revalidatePath("/admin/professionals");
    revalidatePath(`/admin/professionals/${id}`);
    revalidatePath(`/professionals/${id}`);
    revalidatePath("/");
    return;
  }

  await prisma.professional.update({
    where: { id },
    data: { status: "APPROVED", approvedAt: new Date(), rejectionReason: null },
  });
  revalidatePath("/admin/professionals");
}

export async function rejectProfessional(id: string, reason: string) {
  const pendingDraft = await prisma.professionalEditDraft.findFirst({
    where: { professionalId: id, status: "PENDING" },
    select: { id: true },
  });

  if (pendingDraft) {
    await prisma.professionalEditDraft.update({
      where: { id: pendingDraft.id },
      data: { status: "REJECTED", adminNote: reason, reviewedAt: new Date() },
    });
    revalidatePath("/admin/professionals");
    revalidatePath(`/admin/professionals/${id}`);
    return;
  }

  await prisma.professional.update({
    where: { id },
    data: { status: "REJECTED", rejectionReason: reason },
  });
  revalidatePath("/admin/professionals");
}

export async function suspendProfessional(id: string) {
  await prisma.professional.update({
    where: { id },
    data: { status: "SUSPENDED" },
  });
  revalidatePath("/admin/professionals");
}

export async function getProfessionalForAdmin(id: string): Promise<ProfessionalForAdmin | null> {
  return prisma.professional.findUnique({
    where: { id },
    include: professionalForAdminInclude,
  });
}

function asNullableString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}

function asStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function professionalDataFromDraft(draft: { data: Prisma.JsonValue; serviceAreaIds: string[] }) {
  const data = draft.data && typeof draft.data === "object" && !Array.isArray(draft.data)
    ? draft.data as Record<string, unknown>
    : {};

  return {
    mosqueId: asNullableString(data.mosqueId),
    categoryId: typeof data.categoryId === "string" ? data.categoryId : undefined,
    photoUrl: asNullableString(data.photoUrl),
    logoUrl: asNullableString(data.logoUrl),
    businessName: asNullableString(data.businessName),
    title: asNullableString(data.title),
    bio: asNullableString(data.bio),
    yearsOfExperience: typeof data.yearsOfExperience === "number" ? data.yearsOfExperience : null,
    qualifications: asNullableString(data.qualifications),
    licenses: asNullableString(data.licenses),
    languages: asStringArray(data.languages),
    phone: asNullableString(data.phone),
    email: asNullableString(data.email),
    website: asNullableString(data.website),
    whatsapp: asNullableString(data.whatsapp),
    businessAddress: asNullableString(data.businessAddress),
    acceptsWalkIns: data.acceptsWalkIns === true,
    availability: asNullableString(data.availability),
    status: "APPROVED" as const,
    approvedAt: new Date(),
    rejectionReason: null,
    serviceAreas: { set: draft.serviceAreaIds.map((areaId) => ({ id: areaId })) },
  };
}

async function getSponsoredPricingTier(categoryId: string, serviceAreaId: string) {
  const exact = await prisma.sponsoredPricingTier.findFirst({
    where: { categoryId, serviceAreaId, isActive: true },
  });
  if (exact) return exact;

  const categoryOnly = await prisma.sponsoredPricingTier.findFirst({
    where: { categoryId, serviceAreaId: null, isActive: true },
  });
  if (categoryOnly) return categoryOnly;

  return prisma.sponsoredPricingTier.findFirst({
    where: { categoryId: null, serviceAreaId: null, isActive: true },
  });
}

async function getFeaturedPricingTier(city: string) {
  const cityTier = await prisma.featuredPricingTier.findFirst({
    where: { city, isActive: true },
  });
  if (cityTier) return cityTier;

  return prisma.featuredPricingTier.findFirst({
    where: { city: null, isActive: true },
  });
}

function revalidateAdminPromotionPaths() {
  revalidatePath("/");
  revalidatePath("/professionals");
  revalidatePath("/admin/professionals");
  revalidatePath("/admin/sponsored");
  revalidatePath("/admin/featured");
}

export async function makeProfessionalSponsored(professionalId: string) {
  const professional = await prisma.professional.findUnique({
    where: { id: professionalId },
    include: {
      category: { select: { name: true } },
      serviceAreas: { select: { id: true, name: true }, orderBy: { name: "asc" } },
    },
  });

  if (!professional) throw new Error("Professional not found.");
  if (professional.status !== "APPROVED") throw new Error("Only approved professionals can be sponsored.");

  const serviceArea = professional.serviceAreas[0];
  if (!serviceArea) throw new Error("This professional needs at least one service area before they can be sponsored.");

  const existing = await prisma.sponsoredListing.findFirst({
    where: {
      professionalId,
      categoryId: professional.categoryId,
      serviceAreaId: serviceArea.id,
      status: "ACTIVE",
    },
  });

  if (existing) {
    await prisma.professional.update({ where: { id: professionalId }, data: { isSponsored: true } });
    revalidateAdminPromotionPaths();
    return;
  }

  const tier = await getSponsoredPricingTier(professional.categoryId, serviceArea.id);
  const maxSlots = tier?.maxSlots ?? 2;
  const activeCount = await prisma.sponsoredListing.count({
    where: { categoryId: professional.categoryId, serviceAreaId: serviceArea.id, status: "ACTIVE" },
  });

  if (activeCount >= maxSlots) {
    throw new Error(`Sponsored slots are full for ${professional.category.name} in ${serviceArea.name}.`);
  }

  await prisma.$transaction([
    prisma.sponsoredListing.create({
      data: {
        professionalId,
        categoryId: professional.categoryId,
        serviceAreaId: serviceArea.id,
        pricingTierId: tier?.id ?? null,
        priceMonthly: Number(tier?.priceMonthly ?? 49),
        status: "ACTIVE",
        startDate: new Date(),
        adminNote: "Activated directly by admin.",
      },
    }),
    prisma.professional.update({ where: { id: professionalId }, data: { isSponsored: true } }),
  ]);

  revalidateAdminPromotionPaths();
}

export async function makeProfessionalFeatured(professionalId: string) {
  const professional = await prisma.professional.findUnique({
    where: { id: professionalId },
    include: { serviceAreas: { select: { id: true, name: true }, orderBy: { name: "asc" } } },
  });

  if (!professional) throw new Error("Professional not found.");
  if (professional.status !== "APPROVED") throw new Error("Only approved professionals can be featured.");

  const serviceArea = professional.serviceAreas[0];
  if (!serviceArea) throw new Error("This professional needs at least one service area before they can be featured.");

  const city = serviceArea.name;
  const existing = await prisma.featuredListing.findFirst({
    where: { professionalId, city, status: "ACTIVE" },
  });

  if (existing) {
    await prisma.professional.update({ where: { id: professionalId }, data: { isFeatured: true } });
    revalidateAdminPromotionPaths();
    return;
  }

  const tier = await getFeaturedPricingTier(city);
  const maxSlots = tier?.maxSlots ?? 6;
  const activeCount = await prisma.featuredListing.count({
    where: { city, status: "ACTIVE" },
  });

  if (activeCount >= maxSlots) {
    throw new Error(`Featured slots are full for ${city}.`);
  }

  await prisma.$transaction([
    prisma.featuredListing.create({
      data: {
        professionalId,
        city,
        pricingTierId: tier?.id ?? null,
        priceMonthly: Number(tier?.priceMonthly ?? 99),
        status: "ACTIVE",
        startDate: new Date(),
        adminNote: "Activated directly by admin.",
      },
    }),
    prisma.professional.update({ where: { id: professionalId }, data: { isFeatured: true } }),
  ]);

  revalidateAdminPromotionPaths();
}

export async function awardBadge(professionalId: string, type: string) {
  await prisma.verificationBadge.upsert({
    where: { professionalId_type: { professionalId, type: type as never } },
    update: { issuedAt: new Date() },
    create: { professionalId, type: type as never },
  });
  revalidatePath("/admin/professionals");
}

export async function revokeBadge(professionalId: string, type: string) {
  await prisma.verificationBadge.deleteMany({
    where: { professionalId, type: type as never },
  });
  revalidatePath("/admin/professionals");
}

export async function getAdminStats(mosqueSlug: string) {
  const mosque = await prisma.mosque.findUnique({ where: { slug: mosqueSlug } });
  if (!mosque) return null;

  const [
    totalProfessionals,
    pendingProfessionals,
    approvedProfessionals,
    totalMembers,
    openRequests,
    pendingRecommendations,
    pendingProfessionalEdits,
  ] = await Promise.all([
    prisma.professional.count({ where: { mosqueId: mosque.id, status: { not: "WITHDRAWN" } } }),
    prisma.professional.count({ where: { mosqueId: mosque.id, status: "PENDING" } }),
    prisma.professional.count({ where: { mosqueId: mosque.id, status: "APPROVED" } }),
    prisma.user.count({ where: { mosqueId: mosque.id, role: "MEMBER" } }),
    prisma.serviceRequest.count({ where: { mosqueId: mosque.id, status: "OPEN" } }),
    prisma.recommendation.count({ where: { status: "PENDING" } }),
    prisma.professionalEditDraft.count({ where: { status: "PENDING", professional: { mosqueId: mosque.id } } }),
  ]);
  const pendingProfessionalReviews = pendingProfessionals + pendingProfessionalEdits;

  return {
    totalProfessionals,
    pendingProfessionals,
    pendingProfessionalEdits,
    pendingProfessionalReviews,
    approvedProfessionals,
    totalMembers,
    openRequests,
    pendingRecommendations,
  };
}

type VisitorRow = { bucket: Date; visitors: number };
type CountRow = { label: string; count: number };

function formatBucketLabel(date: Date, mode: "hour" | "day" | "month") {
  if (mode === "hour") {
    return date.toLocaleTimeString("en-CA", { hour: "numeric", hour12: true, timeZone: "America/Toronto" });
  }
  if (mode === "day") {
    return date.toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric", timeZone: "America/Toronto" });
  }
  return date.toLocaleDateString("en-CA", { month: "short", year: "numeric", timeZone: "America/Toronto" });
}

function buildSeries(rows: VisitorRow[], mode: "hour" | "day" | "month", count: number) {
  const now = new Date();
  const start = new Date(now);
  if (mode === "hour") {
    start.setMinutes(0, 0, 0);
    start.setHours(start.getHours() - (count - 1));
  } else if (mode === "day") {
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (count - 1));
  } else {
    start.setHours(0, 0, 0, 0);
    start.setDate(1);
    start.setMonth(start.getMonth() - (count - 1));
  }

  const keyedRows = new Map(rows.map((row) => [formatBucketLabel(new Date(row.bucket), mode), Number(row.visitors)]));

  return Array.from({ length: count }, (_, index) => {
    const bucket = new Date(start);
    if (mode === "hour") bucket.setHours(start.getHours() + index);
    if (mode === "day") bucket.setDate(start.getDate() + index);
    if (mode === "month") bucket.setMonth(start.getMonth() + index);

    return {
      label: formatBucketLabel(bucket, mode),
      value: keyedRows.get(formatBucketLabel(bucket, mode)) ?? 0,
    };
  });
}

export async function getAdminAnalytics() {
  const [
    hourlyRows,
    dailyRows,
    monthlyRows,
    topRegions,
    topSearchTerms,
    popularListings,
    totalSearches,
    totalVisitors,
    totalListingViews,
  ] = await Promise.all([
    prisma.$queryRaw<VisitorRow[]>`
      select date_trunc('hour', "createdAt") as bucket, count(distinct "visitorId")::int as visitors
      from analytics_events
      where "eventType" = 'PAGE_VIEW' and "createdAt" >= now() - interval '24 hours'
      group by 1
      order by 1
    `,
    prisma.$queryRaw<VisitorRow[]>`
      select date_trunc('day', "createdAt") as bucket, count(distinct "visitorId")::int as visitors
      from analytics_events
      where "eventType" = 'PAGE_VIEW' and "createdAt" >= now() - interval '7 days'
      group by 1
      order by 1
    `,
    prisma.$queryRaw<VisitorRow[]>`
      select date_trunc('month', "createdAt") as bucket, count(distinct "visitorId")::int as visitors
      from analytics_events
      where "eventType" = 'PAGE_VIEW' and "createdAt" >= now() - interval '12 months'
      group by 1
      order by 1
    `,
    prisma.$queryRaw<CountRow[]>`
      select initcap(trim(region)) as label, count(*)::int as count
      from analytics_events
      where "eventType" = 'HOME_SEARCH'
        and region is not null
        and trim(region) <> ''
      group by lower(trim(region)), initcap(trim(region))
      order by count desc, label asc
      limit 10
    `,
    prisma.$queryRaw<CountRow[]>`
      select trim("searchTerm") as label, count(*)::int as count
      from analytics_events
      where "eventType" = 'HOME_SEARCH'
        and "searchTerm" is not null
        and trim("searchTerm") <> ''
      group by lower(trim("searchTerm")), trim("searchTerm")
      order by count desc, label asc
      limit 10
    `,
    prisma.professional.findMany({
      where: { profileViews: { gt: 0 } },
      select: {
        id: true,
        businessName: true,
        title: true,
        profileViews: true,
        category: { select: { name: true } },
        user: { select: { displayName: true, firstName: true, lastName: true } },
      },
      orderBy: { profileViews: "desc" },
      take: 10,
    }),
    prisma.analyticsEvent.count({ where: { eventType: "HOME_SEARCH" } }),
    prisma.analyticsEvent.findMany({
      where: { eventType: "PAGE_VIEW" },
      distinct: ["visitorId"],
      select: { visitorId: true },
    }),
    prisma.professional.aggregate({ _sum: { profileViews: true } }),
  ]);

  return {
    visitors: {
      hourly: buildSeries(hourlyRows, "hour", 24),
      daily: buildSeries(dailyRows, "day", 7),
      monthly: buildSeries(monthlyRows, "month", 12),
    },
    topRegions: topRegions.map((row) => ({ label: row.label, count: Number(row.count) })),
    topSearchTerms: topSearchTerms.map((row) => ({ label: row.label, count: Number(row.count) })),
    popularListings: popularListings.map((listing) => ({
      id: listing.id,
      name:
        listing.businessName ??
        listing.user.displayName ??
        [listing.user.firstName, listing.user.lastName].filter(Boolean).join(" ") ??
        listing.title,
      category: listing.category.name,
      profileViews: listing.profileViews,
    })),
    totals: {
      searches: totalSearches,
      visitors: totalVisitors.length,
      listingViews: totalListingViews._sum.profileViews ?? 0,
    },
  };
}

export async function getProfessionalsForAdmin(_mosqueSlug: string, status?: string) {
  const professionals = await prisma.professional.findMany({
    where: status
      ? status === "PENDING"
        ? { OR: [{ status: "PENDING" }, { editDrafts: { some: { status: "PENDING" } } }] }
        : { status: status as never }
      : { status: { not: "WITHDRAWN" } },
    include: {
      user: { select: { firstName: true, lastName: true, displayName: true, email: true, phone: true } },
      mosque: { select: { name: true, communityChannelType: true, communityChannelName: true, communityChannelLink: true } },
      category: { select: { id: true, name: true, slug: true } },
      serviceAreas: { select: { id: true, name: true }, orderBy: { name: "asc" } },
      editDrafts: { where: { status: "PENDING" }, orderBy: { submittedAt: "desc" }, take: 1 },
      badges: true,
      recommendations: { where: { status: "APPROVED" }, select: { id: true } },
      credentials: { select: { id: true, name: true, isVerified: true } },
    },
    orderBy: [{ submittedAt: "desc" }, { updatedAt: "desc" }],
  });

  return professionals;
}

export async function getUsersForAdmin(search?: string, role?: string) {
  const trimmedSearch = search?.trim();
  const where = {
    ...(role && role !== "ALL" ? { role: role as never } : {}),
    ...(trimmedSearch
      ? {
          OR: [
            { email: { contains: trimmedSearch, mode: "insensitive" as const } },
            { firstName: { contains: trimmedSearch, mode: "insensitive" as const } },
            { lastName: { contains: trimmedSearch, mode: "insensitive" as const } },
            { displayName: { contains: trimmedSearch, mode: "insensitive" as const } },
            { phone: { contains: trimmedSearch, mode: "insensitive" as const } },
            { whatsapp: { contains: trimmedSearch, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      supabaseId: true,
      email: true,
      firstName: true,
      lastName: true,
      displayName: true,
      avatarUrl: true,
      phone: true,
      whatsapp: true,
      preferredContact: true,
      role: true,
      isActive: true,
      emailVerified: true,
      createdAt: true,
      updatedAt: true,
      mosque: { select: { name: true } },
      professionals: {
        select: {
          id: true,
          businessName: true,
          title: true,
          status: true,
          profileViews: true,
          category: { select: { name: true } },
        },
        orderBy: { updatedAt: "desc" },
      },
      serviceRequests: {
        select: { id: true, status: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
      },
      requesterConversations: {
        select: { id: true, status: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
      },
      sentMessages: {
        select: { id: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      _count: {
        select: {
          professionals: true,
          serviceRequests: true,
          requesterConversations: true,
          sentMessages: true,
          recommendations: true,
          categorySuggestions: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  return users.map((user) => {
    const latestRequest = user.serviceRequests[0]?.updatedAt;
    const latestConversation = user.requesterConversations[0]?.updatedAt;
    const latestMessage = user.sentMessages[0]?.createdAt;
    const lastActivityAt = [user.updatedAt, latestRequest, latestConversation, latestMessage]
      .filter(Boolean)
      .sort((a, b) => b!.getTime() - a!.getTime())[0] ?? user.updatedAt;

    return {
      ...user,
      lastActivityAt,
      professionals: user.professionals.slice(0, 3),
      openRequests: user.serviceRequests.filter((request) => request.status === "OPEN" || request.status === "IN_PROGRESS").length,
      openConversations: user.requesterConversations.filter((conversation) => conversation.status === "OPEN").length,
    };
  });
}
