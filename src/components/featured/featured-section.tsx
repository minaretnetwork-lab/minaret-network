import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";
import { getFeaturedBusinessesForHomepage, getActiveFeaturedCities } from "@/lib/actions/featured";
import { FeaturedBusinessCard } from "./featured-business-card";
import { FeaturedImpressionTracker } from "./featured-impression-tracker";

interface Props {
  city?: string;
}

export async function FeaturedSection({ city }: Props) {
  let rawListings: Awaited<ReturnType<typeof getFeaturedBusinessesForHomepage>>;
  let cities: Awaited<ReturnType<typeof getActiveFeaturedCities>>;

  try {
    [rawListings, cities] = await Promise.all([
      getFeaturedBusinessesForHomepage(city),
      getActiveFeaturedCities(),
    ]);
  } catch {
    // Keep the public homepage available when the database is temporarily
    // unreachable; database-backed sections will return once it reconnects.
    return null;
  }
  const listings = JSON.parse(JSON.stringify(rawListings));

  if (listings.length === 0) return null;

  const sectionTitle = city ? `Featured Businesses in ${city}` : "Featured Businesses";

  return (
    <section className="bg-amber-50/40 dark:bg-amber-900/5 border-y border-amber-100 dark:border-amber-900/20 py-10 sm:py-20">
      <div className="container mx-auto px-4 lg:px-6">

        <div className="flex items-end justify-between mb-6 sm:mb-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
              <p className="text-xs font-semibold uppercase tracking-widest text-amber-700 dark:text-amber-400">
                Community Partners
              </p>
            </div>
            <h2
              className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white"
              style={{ fontFamily: "var(--font-lora)" }}
            >
              {sectionTitle}
            </h2>
          </div>
          <Link
            href="/advertise"
            className="hidden sm:flex items-center gap-1 text-sm font-medium text-amber-700 hover:text-amber-800 dark:text-amber-400"
          >
            Feature your business <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* City tabs */}
        {cities.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 mb-8">
            <CityTab label="All" city={undefined} active={!city} />
            {cities.map((c) => (
              <CityTab key={c} label={c} city={c} active={city === c} />
            ))}
          </div>
        )}

        {/* Cards */}
        <div className={listings.length === 1
          ? "flex justify-center"
          : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5"
        }>
          {listings.length === 1 ? (
            <div className="w-full max-w-[500px]">
              <FeaturedBusinessCard listing={listings[0] as never} />
            </div>
          ) : listings.map((l) => (
            <FeaturedBusinessCard key={l.id} listing={l as never} />
          ))}
        </div>

        <div className="mt-6 text-center sm:hidden">
          <Link href="/advertise" className="text-sm text-amber-700 dark:text-amber-400 hover:underline">
            Feature your business →
          </Link>
        </div>

        {/* Track impressions client-side */}
        <FeaturedImpressionTracker ids={listings.map((l) => l.id)} />
      </div>
    </section>
  );
}

function CityTab({ label, city, active }: { label: string; city?: string; active: boolean }) {
  const href = city ? `/?featured_city=${encodeURIComponent(city)}` : "/";
  return (
    <Link
      href={href}
      className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-medium border transition-all ${
        active
          ? "bg-amber-700 text-white border-amber-700"
          : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800 hover:border-amber-300"
      }`}
    >
      {label}
    </Link>
  );
}
