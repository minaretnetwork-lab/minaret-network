export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { SearchBar } from "@/components/professionals/search-bar";
import { SearchFilters } from "@/components/professionals/search-filters";
import { ProfessionalCard } from "@/components/professionals/professional-card";
import { getProfessionals } from "@/lib/actions/professionals";
import { prisma } from "@/lib/prisma";
import { DEFAULT_MOSQUE_SLUG } from "@/lib/constants";
import type { SearchFilters as SearchFiltersType } from "@/types";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

async function ProfessionalsGrid({ filters }: { filters: SearchFiltersType }) {
  const professionals = await getProfessionals(DEFAULT_MOSQUE_SLUG, filters);

  if (professionals.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">🔍</div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No professionals found</h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Try adjusting your search or filters.
        </p>
      </div>
    );
  }

  const sponsored = professionals.filter((p) => (p as never as { isSponsored: boolean }).isSponsored);
  const organic = professionals.filter((p) => !(p as never as { isSponsored: boolean }).isSponsored);

  return (
    <>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
        {professionals.length} professional{professionals.length !== 1 ? "s" : ""} found
      </p>

      {sponsored.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-semibold uppercase tracking-widest text-violet-600 dark:text-violet-400">Sponsored</span>
            <div className="flex-1 h-px bg-violet-100 dark:bg-violet-900/30" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {sponsored.map((p) => (
              <ProfessionalCard key={p.id} professional={p as never} />
            ))}
          </div>
          {organic.length > 0 && (
            <div className="flex items-center gap-2 mt-8 mb-3">
              <span className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">Mosque Affiliated Professionals</span>
              <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
            </div>
          )}
        </div>
      )}

      {organic.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {organic.map((p) => (
            <ProfessionalCard key={p.id} professional={p as never} />
          ))}
        </div>
      )}
    </>
  );
}

export default async function ProfessionalsPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const mosque = await prisma.mosque.findUnique({
    where: { slug: DEFAULT_MOSQUE_SLUG },
    include: {
      categories: { where: { isActive: true }, orderBy: { name: "asc" } },
      serviceAreas: { orderBy: { name: "asc" } },
    },
  });

  const filters: SearchFiltersType = {
    query: params.q,
    categorySlug: params.category,
    serviceAreaSlug: params.area,
    locationText: params.location,
    languages: params.lang ? [params.lang] : undefined,
    verifiedOnly: params.verified === "1",
    sortBy: (params.sort as SearchFiltersType["sortBy"]) ?? undefined,
  };

  return (
    <div>
      {/* Disclaimer banner — full width */}
      <div className="bg-amber-50 dark:bg-amber-900/10 border-b border-amber-100 dark:border-amber-900/30 px-4 py-3">
        <div className="container mx-auto lg:px-6 flex items-start gap-2 text-xs text-amber-800 dark:text-amber-300">
          <span className="flex-shrink-0 mt-0.5">ⓘ</span>
          <span>
            <span className="font-semibold">About listings:</span> The &ldquo;Mosque Affiliated&rdquo; badge means the professional&apos;s membership in that mosque&apos;s community channel has been confirmed by an admin. It does not verify professional credentials, licensing, or quality of work. We recommend doing your own due diligence before hiring.
          </span>
        </div>
      </div>

      <div className="container mx-auto px-4 lg:px-6 py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: "var(--font-lora)" }}>
          Find Professionals
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Browse professionals from mosque communities across the GTA
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
        {/* Sidebar — stacks on top on mobile, left column on desktop */}
        <aside className="lg:w-64 flex-shrink-0 space-y-3 lg:space-y-4">
          <SearchBar defaultValue={params.q ?? ""} />
          <SearchFilters
            categories={mosque?.categories ?? []}
            serviceAreas={mosque?.serviceAreas ?? []}
          />
        </aside>

        {/* Results */}
        <div className="flex-1 min-w-0">
          <Suspense
            fallback={
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-64 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
                ))}
              </div>
            }
          >
            <ProfessionalsGrid filters={filters} />
          </Suspense>
        </div>
      </div>
      </div>
    </div>
  );
}
