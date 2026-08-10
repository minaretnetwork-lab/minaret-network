import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const EVENT_TYPES = new Set(["PAGE_VIEW", "HOME_SEARCH"]);

function cleanText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return null;
  const normalized = value.trim().replace(/\s+/g, " ");
  return normalized ? normalized.slice(0, maxLength) : null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const eventType = cleanText(body.eventType, 40);
    const visitorId = cleanText(body.visitorId, 80);

    if (!eventType || !EVENT_TYPES.has(eventType) || !visitorId) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    await prisma.analyticsEvent.create({
      data: {
        eventType: eventType as "PAGE_VIEW" | "HOME_SEARCH",
        visitorId,
        path: cleanText(body.path, 250),
        searchTerm: cleanText(body.searchTerm, 120),
        region: cleanText(body.region, 120),
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
