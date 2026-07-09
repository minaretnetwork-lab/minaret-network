import { getFeaturedListingsForAdmin } from "@/lib/actions/featured";
import { FeaturedManagement } from "@/components/admin/featured-management";

export const metadata = { title: "Featured Businesses" };

export default async function AdminFeaturedPage() {
  const raw = await getFeaturedListingsForAdmin();
  const { pending, active, waitlist, tiers } = JSON.parse(JSON.stringify(raw));

  const totalRevenue = active.reduce((sum: number, l: { priceMonthly: number }) => sum + Number(l.priceMonthly), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Featured Businesses</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Approve applications, manage active listings, and configure city pricing
        </p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{pending.length}</p>
          <p className="text-xs text-gray-500 mt-1">Pending</p>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{active.length}</p>
          <p className="text-xs text-gray-500 mt-1">Active</p>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-gray-500">{waitlist.length}</p>
          <p className="text-xs text-gray-500 mt-1">Waitlisted</p>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600">${totalRevenue}</p>
          <p className="text-xs text-gray-500 mt-1">MRR (CAD)</p>
        </div>
      </div>

      <FeaturedManagement
        pending={pending}
        active={active}
        waitlist={waitlist}
        tiers={tiers}
      />
    </div>
  );
}
