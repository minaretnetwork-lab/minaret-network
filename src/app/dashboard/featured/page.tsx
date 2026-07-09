import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/actions/auth";
import { getMyFeaturedListings, getActiveFeaturedCities } from "@/lib/actions/featured";
import { prisma } from "@/lib/prisma";
import { DEFAULT_MOSQUE_SLUG } from "@/lib/constants";
import { FeaturedBusinessDashboard } from "@/components/dashboard/featured-business-dashboard";

export const metadata = { title: "Featured Business" };

export default async function FeaturedDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const [rawData, allCities, mosque] = await Promise.all([
    getMyFeaturedListings(),
    getActiveFeaturedCities(),
    prisma.mosque.findUnique({
      where: { slug: DEFAULT_MOSQUE_SLUG },
      select: { serviceAreas: { select: { name: true }, orderBy: { name: "asc" } } },
    }),
  ]);

  const data = rawData ? JSON.parse(JSON.stringify(rawData)) : null;

  const availableCities = mosque?.serviceAreas.map((a) => a.name) ?? [];

  if (!data?.professional) {
    return (
      <div className="text-center py-16 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl">
        <div className="text-4xl mb-4">⭐</div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No professional profile found</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Register as a professional to access Featured Business.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Featured Business</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Get your business featured on the Minaret Network homepage
        </p>
      </div>

      <FeaturedBusinessDashboard
        listings={data.listings}
        waitlist={data.waitlist}
        professional={data.professional}
        allCities={availableCities}
      />
    </div>
  );
}
