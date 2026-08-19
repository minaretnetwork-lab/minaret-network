import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/actions/auth";
import { getMyOffers } from "@/lib/actions/offers";
import { OffersDashboard } from "@/components/dashboard/offers-dashboard";

export const metadata = { title: "Community Offers" };

export default async function OffersDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const data = await getMyOffers();
  if (!data) redirect("/professionals/register");

  const { offers, professional } = JSON.parse(JSON.stringify(data));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Community Offers</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Post time-limited deals and promotions to reach GTA mosque community members.
        </p>
      </div>
      <OffersDashboard offers={offers} professional={professional} />
    </div>
  );
}
