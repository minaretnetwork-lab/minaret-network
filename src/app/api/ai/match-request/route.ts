import { NextResponse } from "next/server";
import { DEFAULT_MOSQUE_SLUG } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { buildWhatsAppUrl } from "@/lib/utils";
import type { Prisma } from "@prisma/client";
import {
  distanceBetweenServiceAreas,
  findServiceAreaCoordinateByName,
  findServiceAreaCoordinateBySlug,
} from "@/lib/service-area-coordinates";

export const dynamic = "force-dynamic";

type MatchRequestBody = {
  issue?: string;
  location?: string;
};

type Classification = {
  issue_summary: string;
  matched_categories: string[];
  location_text: string | null;
  urgency: "emergency" | "today" | "this_week" | "flexible" | "unknown";
  confidence: number;
};

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim().slice(0, 2000) : "";
}

function nameForUser(user: { displayName: string | null; firstName: string | null; lastName: string | null }) {
  return user.displayName || [user.firstName, user.lastName].filter(Boolean).join(" ") || "Professional";
}

function firstNameForUser(user: { displayName: string | null; firstName: string | null; lastName: string | null }) {
  return user.firstName || user.displayName?.split(" ")[0] || [user.firstName, user.lastName].filter(Boolean).join(" ") || "Professional";
}

function inferUrgency(issue: string): Classification["urgency"] {
  const lower = issue.toLowerCase();
  if (/\b(emergency|urgent|asap|right now|immediately)\b/.test(lower)) return "emergency";
  if (/\b(today|tonight|this morning|this afternoon)\b/.test(lower)) return "today";
  if (/\b(this week|weekend|few days|next few days)\b/.test(lower)) return "this_week";
  if (/\b(whenever|flexible|no rush)\b/.test(lower)) return "flexible";
  return "unknown";
}

function fallbackClassify(issue: string, location: string, categories: { name: string; slug: string }[]): Classification {
  const lower = issue.toLowerCase();
  const scored = categories
    .map((category) => {
      const words = `${category.name} ${category.slug.replace(/-/g, " ")}`.toLowerCase().split(/\s+/);
      let score = words.reduce((total, word) => total + (word.length > 2 && lower.includes(word) ? 2 : 0), 0);
      if (/leak|sink|toilet|pipe|drain|faucet|water/.test(lower) && /plumb/.test(category.slug)) score += 8;
      if (/outlet|breaker|light|wiring|electric/.test(lower) && /electric/.test(category.slug)) score += 8;
      if (/hair|fade|beard|barber|haircut/.test(lower) && /barber|hair/.test(category.slug)) score += 8;
      if (/baby|babysit|child|kid|daycare/.test(lower) && /childcare/.test(category.slug)) score += 8;
      if (/tax|account|bookkeep|hst/.test(lower) && /account/.test(category.slug)) score += 8;
      if (/house|buy|sell|realtor|property/.test(lower) && /realtor/.test(category.slug)) score += 8;
      return { category, score };
    })
    .sort((a, b) => b.score - a.score);

  const matches = scored.filter((item) => item.score > 0).slice(0, 3).map((item) => item.category.name);

  return {
    issue_summary: issue.slice(0, 240),
    matched_categories: matches.length > 0 ? matches : categories.slice(0, 1).map((category) => category.name),
    location_text: location || null,
    urgency: inferUrgency(issue),
    confidence: matches.length > 0 ? 0.72 : 0.35,
  };
}

async function classifyWithOpenAI(issue: string, location: string, categories: { name: string; slug: string }[]) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;

  const schema = {
    type: "object",
    additionalProperties: false,
    properties: {
      issue_summary: { type: "string" },
      matched_categories: {
        type: "array",
        items: { type: "string", enum: categories.map((category) => category.name) },
        minItems: 1,
        maxItems: 3,
      },
      location_text: { type: ["string", "null"] },
      urgency: { type: "string", enum: ["emergency", "today", "this_week", "flexible", "unknown"] },
      confidence: { type: "number", minimum: 0, maximum: 1 },
    },
    required: ["issue_summary", "matched_categories", "location_text", "urgency", "confidence"],
  };

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MATCH_MODEL?.trim() || "gpt-5.6-luna",
      input: [
        {
          role: "system",
          content:
            "Classify a visitor's service request for a mosque professional directory. Choose only from the provided category names. Do not invent categories or businesses.",
        },
        {
          role: "user",
          content: JSON.stringify({
            visitor_issue: issue,
            visitor_location: location || null,
            available_categories: categories.map((category) => category.name),
          }),
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "minaret_service_match",
          strict: true,
          schema,
        },
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    console.error("OpenAI match request failed", response.status, text.slice(0, 500));
    return null;
  }

  const payload = await response.json();
  const outputText = payload.output
    ?.flatMap((item: { type?: string; content?: { text?: string }[] }) => item.type === "message" ? item.content ?? [] : [])
    ?.map((content: { text?: string }) => content.text ?? "")
    ?.join("");

  if (!outputText) return null;

  try {
    return JSON.parse(outputText) as Classification;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as MatchRequestBody;
  const issue = cleanText(body.issue);
  const location = cleanText(body.location);

  if (issue.length < 8) {
    return NextResponse.json({ error: "Please describe what you need help with." }, { status: 400 });
  }

  const mosque = await prisma.mosque.findUnique({
    where: { slug: DEFAULT_MOSQUE_SLUG },
    include: {
      categories: {
        where: { isActive: true },
        select: { id: true, name: true, slug: true, icon: true },
        orderBy: { name: "asc" },
      },
      serviceAreas: {
        select: { id: true, name: true, slug: true },
        orderBy: { name: "asc" },
      },
    },
  });

  if (!mosque) return NextResponse.json({ error: "Directory is not configured." }, { status: 500 });

  const classification =
    await classifyWithOpenAI(issue, location, mosque.categories) ??
    fallbackClassify(issue, location, mosque.categories);

  const matchedCategoryNames = new Set(classification.matched_categories.map((name) => name.toLowerCase()));
  const matchedCategories = mosque.categories.filter((category) => matchedCategoryNames.has(category.name.toLowerCase()));
  const categoryIds = matchedCategories.map((category) => category.id);
  const locationLower = (classification.location_text || location).toLowerCase();
  const matchedArea =
    mosque.serviceAreas.find((area) => area.name.toLowerCase() === locationLower) ??
    mosque.serviceAreas.find((area) => locationLower.includes(area.name.toLowerCase()) || area.name.toLowerCase().includes(locationLower)) ??
    null;

  const professionalInclude = {
    user: { select: { firstName: true, lastName: true, displayName: true, email: true, avatarUrl: true } },
    category: { select: { id: true, name: true, slug: true, icon: true } },
    categories: { select: { id: true, name: true, slug: true, icon: true }, orderBy: { name: "asc" } },
    serviceAreas: { select: { id: true, name: true, slug: true } },
    badges: { select: { type: true } },
    recommendations: { where: { status: "APPROVED" }, select: { id: true } },
  } satisfies Prisma.ProfessionalInclude;

  const professionalOrderBy = [
    { isSponsored: "desc" },
    { isFeatured: "desc" },
    { recommendations: { _count: "desc" } },
    { profileViews: "desc" },
  ] satisfies Prisma.ProfessionalOrderByWithRelationInput[];

  const localProfessionals = categoryIds.length > 0
    ? await prisma.professional.findMany({
        where: {
          mosqueId: mosque.id,
          status: "APPROVED",
          OR: [
            { categoryId: { in: categoryIds } },
            { categories: { some: { id: { in: categoryIds } } } },
          ],
          ...(matchedArea ? { serviceAreas: { some: { id: matchedArea.id } } } : {}),
        },
        include: professionalInclude,
        orderBy: professionalOrderBy,
        take: 5,
      })
    : [];

  let isLocationFallback = false;
  let professionals = localProfessionals.map((professional) => ({
    ...professional,
    fallbackDistanceKm: null as number | null,
  }));

  const origin = matchedArea
    ? findServiceAreaCoordinateBySlug(matchedArea.slug) ?? findServiceAreaCoordinateByName(matchedArea.name)
    : findServiceAreaCoordinateByName(classification.location_text || location);

  if (professionals.length === 0 && categoryIds.length > 0 && origin) {
    isLocationFallback = true;
    const fallbackProfessionals = await prisma.professional.findMany({
      where: {
        mosqueId: mosque.id,
        status: "APPROVED",
        OR: [
          { categoryId: { in: categoryIds } },
          { categories: { some: { id: { in: categoryIds } } } },
        ],
      },
      include: professionalInclude,
      orderBy: professionalOrderBy,
    });

    professionals = fallbackProfessionals
      .map((professional) => {
        const nearest = professional.serviceAreas.reduce<number | null>((best, area) => {
          const coordinate = findServiceAreaCoordinateBySlug(area.slug) ?? findServiceAreaCoordinateByName(area.name);
          if (!coordinate) return best;
          const distanceKm = distanceBetweenServiceAreas(origin, coordinate);
          return best === null || distanceKm < best ? distanceKm : best;
        }, null);

        return {
          ...professional,
          fallbackDistanceKm: nearest === null ? null : Math.round(nearest * 10) / 10,
        };
      })
      .sort((a, b) => {
        const distanceA = a.fallbackDistanceKm ?? Number.POSITIVE_INFINITY;
        const distanceB = b.fallbackDistanceKm ?? Number.POSITIVE_INFINITY;
        if (distanceA !== distanceB) return distanceA - distanceB;
        if (a.isSponsored !== b.isSponsored) return a.isSponsored ? -1 : 1;
        if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
        return b.recommendations.length - a.recommendations.length;
      })
      .slice(0, 5);
  }

  return NextResponse.json({
    classification,
    matchedCategory: matchedCategories[0] ?? null,
    matchedArea,
    isLocationFallback,
    professionals: professionals.map((professional) => {
      const ownerName = nameForUser(professional.user);
      const businessName = professional.businessName || professional.title || ownerName;
      const whatsappPhone = professional.whatsapp || professional.phone;
      return {
        id: professional.id,
        businessName,
        ownerName,
        ownerFirstName: firstNameForUser(professional.user),
        category: professional.category,
        categories: professional.categories.length > 0 ? professional.categories : [professional.category],
        serviceAreas: professional.serviceAreas,
        badges: professional.badges.map((badge) => badge.type),
        recommendationCount: professional.recommendations.length,
        isFeatured: professional.isFeatured,
        isSponsored: professional.isSponsored,
        distanceKm: professional.fallbackDistanceKm,
        profileUrl: `/professionals/${professional.id}`,
        whatsappUrl: whatsappPhone
          ? buildWhatsAppUrl(whatsappPhone, `Hi ${businessName}, I found your profile on Minaret Network.`)
          : null,
        emailUrl: professional.email || professional.user.email ? `mailto:${professional.email || professional.user.email}` : null,
        callUrl: professional.phone ? `tel:${professional.phone}` : null,
      };
    }),
    draft: {
      categoryId: matchedCategories[0]?.id ?? "",
      categoryName: matchedCategories[0]?.name ?? "",
      categoryIcon: matchedCategories[0]?.icon ?? "",
      serviceAreaId: matchedArea?.id ?? "",
      description: classification.issue_summary || issue,
      preferredContact: "WHATSAPP",
      preferredDate: "",
    },
  });
}
