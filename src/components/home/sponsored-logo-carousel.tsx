import { prisma } from "@/lib/prisma";
import Link from "next/link";

async function getSponsoredLogos() {
  return prisma.professional.findMany({
    where: { isSponsored: true, logoUrl: { not: null }, status: "APPROVED" },
    select: {
      id: true,
      logoUrl: true,
      businessName: true,
      title: true,
      user: { select: { firstName: true, lastName: true } },
    },
    orderBy: { updatedAt: "desc" },
  }) as Promise<Array<{ id: string; logoUrl: string | null; businessName: string | null; title: string | null; user: { firstName: string | null; lastName: string | null } }>>;
}

export async function SponsoredLogoCarousel() {
  let sponsors: Awaited<ReturnType<typeof getSponsoredLogos>> = [];
  try {
    sponsors = await getSponsoredLogos();
  } catch {
    return null;
  }
  if (sponsors.length === 0) return null;

  const sponsorTiles = sponsors.map((s) => {
    const name = s.businessName || [s.user.firstName, s.user.lastName].filter(Boolean).join(" ") || s.title || "Business";
    return { ...s, name };
  });

  if (sponsorTiles.length === 1) {
    return (
      <div className="border-b border-gray-100 dark:border-gray-900 bg-white dark:bg-gray-950 py-5 overflow-hidden">
        <div className="container mx-auto px-4 mb-3">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 text-center">
            Featured community businesses
          </p>
        </div>

        <div className="container mx-auto flex justify-center px-4">
          <SponsorLogoTile sponsor={sponsorTiles[0]} />
        </div>
      </div>
    );
  }

  const items = sponsors.length < 6 ? [...sponsors, ...sponsors, ...sponsors] : sponsors;
  const doubled = [...items, ...items].map((s) => {
    const name = s.businessName || [s.user.firstName, s.user.lastName].filter(Boolean).join(" ") || s.title || "Business";
    return { ...s, name };
  });

  const speed = Math.max(20, items.length * 4);

  return (
    <div className="border-b border-gray-100 dark:border-gray-900 bg-white dark:bg-gray-950 py-5 overflow-hidden">
      <div className="container mx-auto px-4 mb-3">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 text-center">
          Featured community businesses
        </p>
      </div>

      <div className="relative overflow-hidden">
        {/* Fade edges */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-10 sm:w-20 z-10 bg-gradient-to-r from-white dark:from-gray-950 to-transparent" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-10 sm:w-20 z-10 bg-gradient-to-l from-white dark:from-gray-950 to-transparent" />

        <div
          className="flex items-center gap-8 w-max"
          style={{ animation: `marquee ${speed}s linear infinite` }}
        >
          {doubled.map((s, i) => (
            <SponsorLogoTile key={`${s.id}-${i}`} sponsor={s} />
          ))}
        </div>
      </div>
    </div>
  );
}

function SponsorLogoTile({
  sponsor,
}: {
  sponsor: Awaited<ReturnType<typeof getSponsoredLogos>>[number] & { name: string };
}) {
  const initials = sponsor.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <Link
      href={`/professionals/${sponsor.id}`}
      className="flex-shrink-0 group"
      title={sponsor.name}
    >
      <div className="h-14 w-48 flex items-center gap-3 px-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 group-hover:border-emerald-200 dark:group-hover:border-emerald-800 transition-colors">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-emerald-50 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
          {sponsor.logoUrl ? (
            <img
              src={sponsor.logoUrl}
              alt=""
              className="h-full w-full object-contain p-1.5 grayscale group-hover:grayscale-0 transition-all duration-300 opacity-70 group-hover:opacity-100"
            />
          ) : (
            initials || "MN"
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-gray-700 dark:text-gray-200 group-hover:text-emerald-700 dark:group-hover:text-emerald-400">
            {sponsor.name}
          </p>
          {sponsor.title && (
            <p className="truncate text-[11px] text-gray-400">
              {sponsor.title}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
