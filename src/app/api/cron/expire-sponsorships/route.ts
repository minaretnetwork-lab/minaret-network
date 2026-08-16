import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Called hourly by the local Windows scheduled task through
// scripts/run-expire-sponsorships.ps1. It can also be invoked manually with
// the CRON_SECRET bearer token.
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Flip isSponsored = false for professionals with no ACTIVE sponsored listing.
  const expiredSponsored = await prisma.professional.updateMany({
    where: {
      isSponsored: true,
      sponsoredListings: { none: { status: "ACTIVE" } },
    },
    data: { isSponsored: false },
  });

  // Flip isFeatured = false for professionals with no ACTIVE featured listing.
  const expiredFeatured = await prisma.professional.updateMany({
    where: {
      isFeatured: true,
      featuredListings: { none: { status: "ACTIVE" } },
    },
    data: { isFeatured: false },
  });

  // Expire event listings whose expiresAt has passed.
  const expiredEvents = await prisma.eventListing.updateMany({
    where: {
      status: "ACTIVE",
      expiresAt: { lt: new Date() },
    },
    data: { status: "EXPIRED" },
  });

  return NextResponse.json({
    ok: true,
    sponsoredExpired: expiredSponsored.count,
    featuredExpired: expiredFeatured.count,
    eventsExpired: expiredEvents.count,
    ranAt: new Date().toISOString(),
  });
}
