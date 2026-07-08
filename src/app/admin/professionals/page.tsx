import { getProfessionalsForAdmin } from "@/lib/actions/admin";
import { DEFAULT_MOSQUE_SLUG } from "@/lib/constants";
import { AdminProfessionalTable } from "@/components/admin/professional-table";

export const metadata = { title: "Manage Professionals" };

interface Props {
  searchParams: Promise<{ status?: string }>;
}

export default async function AdminProfessionalsPage({ searchParams }: Props) {
  const { status } = await searchParams;
  const professionals = await getProfessionalsForAdmin(DEFAULT_MOSQUE_SLUG, status);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Professionals</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Review and manage professional applications
          </p>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-800 pb-px overflow-x-auto">
        {[
          { label: "All", value: undefined },
          { label: "Pending", value: "PENDING" },
          { label: "Approved", value: "APPROVED" },
          { label: "Rejected", value: "REJECTED" },
          { label: "Suspended", value: "SUSPENDED" },
        ].map((tab) => (
          <a
            key={tab.label}
            href={tab.value ? `/admin/professionals?status=${tab.value}` : "/admin/professionals"}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${
              status === tab.value || (!status && !tab.value)
                ? "border-green-600 text-green-700 dark:text-green-400"
                : "border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
            }`}
          >
            {tab.label}
          </a>
        ))}
      </div>

      <AdminProfessionalTable professionals={professionals as never} />
    </div>
  );
}
