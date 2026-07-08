import { getMosques } from "@/lib/actions/mosques";
import { MosqueManagement } from "@/components/admin/mosque-management";

export const metadata = { title: "Manage Mosques" };

export default async function AdminMosquesPage() {
  const mosques = await getMosques();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mosques</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Onboard mosques and configure their community channels. Professionals select their mosque when registering,
          and admins use the community channel link to verify affiliation before awarding the badge.
        </p>
      </div>
      <MosqueManagement mosques={mosques as never} />
    </div>
  );
}
