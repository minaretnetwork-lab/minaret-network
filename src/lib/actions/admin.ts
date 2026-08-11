"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function approveProfessional(id: string) {
  await prisma.professional.update({
    where: { id },
    data: { status: "APPROVED", approvedAt: new Date(), rejectionReason: null },
  });
  revalidatePath("/admin/professionals");
}

export async function rejectProfessional(id: string, reason: string) {
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
  ] = await Promise.all([
    prisma.professional.count({ where: { mosqueId: mosque.id } }),
    prisma.professional.count({ where: { mosqueId: mosque.id, status: "PENDING" } }),
    prisma.professional.count({ where: { mosqueId: mosque.id, status: "APPROVED" } }),
    prisma.user.count({ where: { mosqueId: mosque.id, role: "MEMBER" } }),
    prisma.serviceRequest.count({ where: { mosqueId: mosque.id, status: "OPEN" } }),
    prisma.recommendation.count({ where: { status: "PENDING" } }),
  ]);

  return {
    totalProfessionals,
    pendingProfessionals,
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
    where: { ...(status && { status: status as never }) },
    include: {
      user: { select: { firstName: true, lastName: true, displayName: true, email: true, phone: true } },
      mosque: { select: { name: true, communityChannelType: true, communityChannelName: true, communityChannelLink: true } },
      category: { select: { id: true, name: true, slug: true } },
      badges: true,
      recommendations: { where: { status: "APPROVED" }, select: { id: true } },
      credentials: { select: { id: true, name: true, isVerified: true } },
    },
    orderBy: { submittedAt: "desc" },
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
