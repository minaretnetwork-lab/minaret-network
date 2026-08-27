import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Called by a monthly cron job (e.g. `curl https://minaretnetwork.ca/api/cron/expire-featured`)
// Finds active featured listings whose startDate is older than 30 days and cancels them,
// resetting the professional's isFeatured flag so a new business can be featured.
export async function POST(request: Request) {
  const secret = request.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);

  const expired = await prisma.featuredListing.findMany({
    where: {
      status: "ACTIVE",
      startDate: { lt: cutoff },
    },
    select: { id: true, professionalId: true },
  });

  if (expired.length === 0) {
    return NextResponse.json({ cancelled: 0, message: "No expired listings" });
  }

  const ids = expired.map((l) => l.id);
  const professionalIds = [...new Set(expired.map((l) => l.professionalId))];

  await prisma.$transaction([
    prisma.featuredListing.updateMany({
      where: { id: { in: ids } },
      data: { status: "CANCELLED", cancelledAt: new Date() },
    }),
    prisma.professional.updateMany({
      where: { id: { in: professionalIds } },
      data: { isFeatured: false },
    }),
  ]);

  return NextResponse.json({ cancelled: ids.length, professionalIds });
}
