import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/actions/auth";
import { getMySponsorship } from "@/lib/actions/sponsored";
import { PromoteBusiness } from "@/components/dashboard/promote-business";

export const metadata = { title: "Promote Your Business" };

export default async function PromotePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const data = await getMySponsorship();
  if (!data) redirect("/professionals/register");

  const { listings, waitlist, professional } = JSON.parse(JSON.stringify(data));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Promote Your Business</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Get a Sponsored Listing — pinned to the top of search results for your category across your GTA region.
        </p>
      </div>
      <PromoteBusiness listings={listings} waitlist={waitlist} professional={professional} />
    </div>
  );
}
