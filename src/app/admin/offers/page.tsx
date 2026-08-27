import { getOffersForAdmin, getApprovedProfessionalsForOfferPicker } from "@/lib/actions/offers";
import { OffersAdminPanel } from "@/components/admin/offers-management";

export const metadata = { title: "Community Offers" };

export default async function AdminOffersPage() {
  const [raw, professionals] = await Promise.all([
    getOffersForAdmin(),
    getApprovedProfessionalsForOfferPicker(),
  ]);
  const { pending, active, recent } = JSON.parse(JSON.stringify(raw));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Community Offers</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Approve and manage time-limited offers posted by professionals
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{pending.length}</p>
          <p className="text-xs text-gray-500 mt-1">Pending</p>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{active.length}</p>
          <p className="text-xs text-gray-500 mt-1">Active</p>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-gray-600">{recent.length}</p>
          <p className="text-xs text-gray-500 mt-1">Recent closed</p>
        </div>
      </div>

      <OffersAdminPanel pending={pending} active={active} recent={recent} professionals={JSON.parse(JSON.stringify(professionals))} />
    </div>
  );
}
