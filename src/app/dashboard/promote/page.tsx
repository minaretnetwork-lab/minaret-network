import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/actions/auth";
import { getMySponsorship } from "@/lib/actions/sponsored";
import { PromoteBusiness } from "@/components/dashboard/promote-business";

export const metadata = { title: "Promote Your Business" };

export default async function PromotePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const rawData = await getMySponsorship();
  const data = rawData ? JSON.parse(JSON.stringify(rawData)) : null;

  if (!data?.professional) {
    return (
      <div className="text-center py-16 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl">
        <div className="text-4xl mb-4">📢</div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No professional profile found
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Register as a professional first to access sponsored listings.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Promote Your Business</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Get featured at the top of search results for your category
        </p>
      </div>

      <PromoteBusiness
        listings={data.listings as never}
        waitlist={data.waitlist as never}
        professional={data.professional as never}
      />
    </div>
  );
}
