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
  const sponsors = await getSponsoredLogos();
  if (sponsors.length === 0) return null;

  const items = sponsors.length < 6 ? [...sponsors, ...sponsors, ...sponsors] : sponsors;
  const doubled = [...items, ...items];

  const speed = Math.max(20, items.length * 4);

  return (
    <div className="border-b border-gray-100 dark:border-gray-900 bg-white dark:bg-gray-950 py-5 overflow-hidden">
      <div className="container mx-auto px-4 mb-3">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 text-center">
          Trusted by community businesses
        </p>
      </div>

      <div className="relative overflow-hidden">
        {/* Fade edges */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-20 z-10 bg-gradient-to-r from-white dark:from-gray-950 to-transparent" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-20 z-10 bg-gradient-to-l from-white dark:from-gray-950 to-transparent" />

        <div
          className="flex items-center gap-8 w-max"
          style={{ animation: `marquee ${speed}s linear infinite` }}
        >
          {doubled.map((s, i) => {
            const name = s.businessName || [s.user.firstName, s.user.lastName].filter(Boolean).join(" ") || s.title || "Business";
            return (
              <Link
                key={`${s.id}-${i}`}
                href={`/professionals/${s.id}`}
                className="flex-shrink-0 group"
                title={name}
              >
                <div className="h-12 w-28 flex items-center justify-center px-3 rounded-lg border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 group-hover:border-emerald-200 dark:group-hover:border-emerald-800 transition-colors">
                  <img
                    src={s.logoUrl!}
                    alt={name}
                    className="max-h-8 max-w-[90px] object-contain grayscale group-hover:grayscale-0 transition-all duration-300 opacity-60 group-hover:opacity-100"
                  />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
