import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/actions/auth";
import { getMyFeaturedListings } from "@/lib/actions/featured";
import { FeaturedBusinessDashboard } from "@/components/dashboard/featured-business-dashboard";

export const metadata = { title: "Featured Business" };

export default async function FeaturedDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const data = await getMyFeaturedListings();
  if (!data) redirect("/professionals/register");

  const { listings, waitlist, professional } = JSON.parse(JSON.stringify(data));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Featured Business</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Get your business featured on the Minaret Network homepage — visible to every visitor.
        </p>
      </div>
      <FeaturedBusinessDashboard listings={listings} waitlist={waitlist} professional={professional} />
    </div>
  );
}
