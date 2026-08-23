import { getProfessionalsForAdmin } from "@/lib/actions/admin";
import { DEFAULT_MOSQUE_SLUG } from "@/lib/constants";
import { AdminProfessionalTable } from "@/components/admin/professional-table";
import Link from "next/link";
import { Plus } from "lucide-react";

export const metadata = { title: "Manage Professionals" };

interface Props {
  searchParams: Promise<{ status?: string; filter?: string }>;
}

export default async function AdminProfessionalsPage({ searchParams }: Props) {
  const { status, filter } = await searchParams;
  const professionals = await getProfessionalsForAdmin(DEFAULT_MOSQUE_SLUG, status);

  const displayed = filter === "unclaimed"
    ? professionals.filter((p) => (p as unknown as { isAdminCreated: boolean; claimedByUserId: string | null }).isAdminCreated && !(p as unknown as { claimedByUserId: string | null }).claimedByUserId)
    : professionals;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Professionals</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Review and manage professional applications
          </p>
        </div>
        <Link
          href="/admin/professionals/create"
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-3 py-2 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create Business
        </Link>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-800 pb-px overflow-x-auto">
        {[
          { label: "All", value: undefined, filterVal: undefined },
          { label: "Pending", value: "PENDING", filterVal: undefined },
          { label: "Approved", value: "APPROVED", filterVal: undefined },
          { label: "Unclaimed", value: "APPROVED", filterVal: "unclaimed" },
          { label: "Rejected", value: "REJECTED", filterVal: undefined },
          { label: "Suspended", value: "SUSPENDED", filterVal: undefined },
        ].map((tab) => {
          const href = tab.value
            ? `/admin/professionals?status=${tab.value}${tab.filterVal ? `&filter=${tab.filterVal}` : ""}`
            : "/admin/professionals";
          const isActive = tab.filterVal
            ? status === tab.value && filter === tab.filterVal
            : filter !== "unclaimed" && (status === tab.value || (!status && !tab.value));
          return (
            <a
              key={tab.label}
              href={href}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${
                isActive
                  ? "border-green-600 text-green-700 dark:text-green-400"
                  : "border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
              }`}
            >
              {tab.label}
            </a>
          );
        })}
      </div>

      <AdminProfessionalTable professionals={displayed as never} />
    </div>
  );
}
