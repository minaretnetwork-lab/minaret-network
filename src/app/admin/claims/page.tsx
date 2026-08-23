import { getProfileClaims } from "@/lib/actions/admin";
import { AdminClaimsClient } from "./claims-client";

export const metadata = { title: "Profile Claims" };

interface Props {
  searchParams: Promise<{ status?: string }>;
}

export default async function AdminClaimsPage({ searchParams }: Props) {
  const { status } = await searchParams;
  const validStatus = status === "APPROVED" || status === "REJECTED" ? status : undefined;
  const claims = await getProfileClaims(validStatus ?? "PENDING");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profile Claims</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Review ownership claims submitted by businesses.
        </p>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-800 pb-px">
        {[
          { label: "Pending", value: "PENDING" },
          { label: "Approved", value: "APPROVED" },
          { label: "Rejected", value: "REJECTED" },
        ].map((tab) => (
          <a
            key={tab.label}
            href={`/admin/claims?status=${tab.value}`}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${
              (validStatus ?? "PENDING") === tab.value
                ? "border-green-600 text-green-700 dark:text-green-400"
                : "border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
            }`}
          >
            {tab.label}
          </a>
        ))}
      </div>

      <AdminClaimsClient claims={claims as never} />
    </div>
  );
}
