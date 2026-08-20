export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { SearchBar } from "@/components/professionals/search-bar";
import { SearchFilters } from "@/components/professionals/search-filters";
import { ProfessionalCard } from "@/components/professionals/professional-card";
import { getProfessionals } from "@/lib/actions/professionals";
import { getCurrentUser } from "@/lib/actions/auth";
import { prisma } from "@/lib/prisma";
import { DEFAULT_MOSQUE_SLUG } from "@/lib/constants";
import type { ProfessionalWithRelations, SearchFilters as SearchFiltersType } from "@/types";
import { ListingDisclaimer } from "@/components/professionals/listing-disclaimer";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

async function ProfessionalsGrid({ filters }: { filters: SearchFiltersType }) {
  const [professionals, currentUser] = await Promise.all([
    getProfessionals(DEFAULT_MOSQUE_SLUG, filters),
    getCurrentUser().catch(() => null),
  ]);
  const professionalRows = professionals as ProfessionalWithRelations[];
  const isLoggedIn = !!currentUser;
  const isLocationFallback = professionalRows.some((p) => p.isLocationFallback);

  if (professionalRows.length === 0) {
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

  const sponsored = professionalRows.filter((p) => p.isSponsored);
  const organic = professionalRows.filter((p) => !p.isSponsored);

  return (
    <>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
        {professionalRows.length} professional{professionalRows.length !== 1 ? "s" : ""} found
      </p>

      {isLocationFallback && (
        <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-900/10 dark:text-amber-200">
          No exact local matches were found, so these are the closest matching professionals sorted by distance.
        </div>
      )}

      {sponsored.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-semibold uppercase tracking-widest text-violet-600 dark:text-violet-400">Sponsored</span>
            <div className="flex-1 h-px bg-violet-100 dark:bg-violet-900/30" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {sponsored.map((p) => (
              <ProfessionalCard key={p.id} professional={p} isLoggedIn={isLoggedIn} />
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
            <ProfessionalCard key={p.id} professional={p} isLoggedIn={isLoggedIn} />
          ))}
        </div>
      )}
    </>
  );
}

export default async function ProfessionalsPage({ searchParams }: PageProps) {
  const params = await searchParams;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mosque: any = null;
  let dbError: string | null = null;
  try {
    mosque = await prisma.mosque.findUnique({
      where: { slug: DEFAULT_MOSQUE_SLUG },
      include: {
        categories: { where: { isActive: true }, orderBy: { name: "asc" } },
        serviceAreas: { orderBy: { name: "asc" } },
      },
    });
  } catch (e) {
    dbError = String(e);
  }

  if (dbError) {
    return <pre style={{ padding: 24, whiteSpace: "pre-wrap", wordBreak: "break-all" }}>{dbError}</pre>;
  }

  const filters: SearchFiltersType = {
    query: params.q,
    categorySlug: params.category,
    serviceAreaSlug: params.area,
    locationText: params.location,
    languages: params.lang ? [params.lang] : undefined,
    verifiedOnly: params.verified === "1",
    affiliatedMosqueSlug: params.mosque,
    sortBy: (params.sort as SearchFiltersType["sortBy"]) ?? undefined,
  };

  return (
    <div>
      <ListingDisclaimer />

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
