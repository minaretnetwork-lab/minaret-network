import { getSponsoredListingsForAdmin } from "@/lib/actions/sponsored";
import { SponsoredManagement } from "@/components/admin/sponsored-management";

export const metadata = { title: "Sponsored Listings" };

export default async function AdminSponsoredPage() {
  const raw = await getSponsoredListingsForAdmin();
  // Serialize Decimal fields (priceMonthly) so they're plain numbers for the Client Component
  const { pending, active, waitlist, tiers } = JSON.parse(JSON.stringify(raw));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sponsored Listings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Approve applications and manage active sponsored listing slots
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{pending.length}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Pending</p>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-violet-600">{active.length}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Active</p>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">{waitlist.length}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Waitlisted</p>
        </div>
      </div>

      <SponsoredManagement
        pending={pending as never}
        active={active as never}
        waitlist={waitlist as never}
        tiers={tiers as never}
      />
    </div>
  );
}
