import Link from "next/link";
import { Search, ShieldCheck, UserRound } from "lucide-react";
import { getUsersForAdmin } from "@/lib/actions/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Users" };

interface Props {
  searchParams: Promise<{ q?: string; role?: string }>;
}

const ROLE_OPTIONS = ["ALL", "MEMBER", "PROFESSIONAL", "ADMIN", "SUPER_ADMIN"];

const ROLE_BADGE: Record<string, string> = {
  MEMBER: "bg-gray-100 text-gray-700 border-gray-200",
  PROFESSIONAL: "bg-emerald-100 text-emerald-700 border-emerald-200",
  ADMIN: "bg-blue-100 text-blue-700 border-blue-200",
  SUPER_ADMIN: "bg-amber-100 text-amber-800 border-amber-200",
};

function formatShortDate(date: Date | string) {
  return new Date(date).toLocaleDateString("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function displayName(user: {
  displayName: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string;
}) {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");
  return user.displayName ?? (fullName || user.email);
}

export default async function AdminUsersPage({ searchParams }: Props) {
  const { q = "", role = "ALL" } = await searchParams;
  const users = await getUsersForAdmin(q, role);

  const activeCount = users.filter((user) => user.isActive).length;
  const professionalCount = users.filter((user) => user.role === "PROFESSIONAL").length;
  const adminCount = users.filter((user) => user.role === "ADMIN" || user.role === "SUPER_ADMIN").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Users</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Registered accounts, contact details, roles, and activity signals.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center sm:min-w-80">
          <div className="rounded-xl border border-gray-200 bg-white px-3 py-2 dark:border-gray-800 dark:bg-gray-900">
            <p className="text-lg font-bold text-gray-900 dark:text-white">{users.length}</p>
            <p className="text-[11px] uppercase tracking-wide text-gray-400">Shown</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white px-3 py-2 dark:border-gray-800 dark:bg-gray-900">
            <p className="text-lg font-bold text-gray-900 dark:text-white">{professionalCount}</p>
            <p className="text-[11px] uppercase tracking-wide text-gray-400">Pros</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white px-3 py-2 dark:border-gray-800 dark:bg-gray-900">
            <p className="text-lg font-bold text-gray-900 dark:text-white">{adminCount}</p>
            <p className="text-[11px] uppercase tracking-wide text-gray-400">Admins</p>
          </div>
        </div>
      </div>

      <form className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            name="q"
            defaultValue={q}
            placeholder="Search name, email, phone..."
            className="h-10 pl-9"
          />
        </div>
        <select
          name="role"
          defaultValue={role}
          className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200"
        >
          {ROLE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option === "ALL" ? "All roles" : option.replace("_", " ")}
            </option>
          ))}
        </select>
        <Button type="submit" className="h-10 bg-emerald-700 text-white hover:bg-emerald-800">
          Filter
        </Button>
        {(q || role !== "ALL") && (
          <Link href="/admin/users">
            <Button type="button" variant="outline" className="h-10 w-full md:w-auto">
              Clear
            </Button>
          </Link>
        )}
      </form>

      {users.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white py-16 text-center dark:border-gray-800 dark:bg-gray-900">
          <UserRound className="mx-auto mb-3 h-9 w-9 text-gray-300" />
          <p className="text-sm text-gray-400">No users match this filter.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="overflow-x-auto">
            <table className="min-w-[1120px] w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:border-gray-800 dark:bg-gray-900/60">
                <tr>
                  <th className="px-4 py-3 font-semibold">User</th>
                  <th className="px-4 py-3 font-semibold">Role</th>
                  <th className="px-4 py-3 font-semibold">Contact</th>
                  <th className="px-4 py-3 font-semibold">Listings</th>
                  <th className="px-4 py-3 font-semibold">Requests</th>
                  <th className="px-4 py-3 font-semibold">Messages</th>
                  <th className="px-4 py-3 font-semibold">Joined</th>
                  <th className="px-4 py-3 font-semibold">Last activity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {users.map((user) => {
                  const name = displayName(user);
                  const primaryListing = user.professionals[0];
                  const totalProfileViews = user.professionals.reduce((sum, professional) => sum + professional.profileViews, 0);

                  return (
                    <tr key={user.id} className="align-top transition hover:bg-emerald-50/40 dark:hover:bg-emerald-950/10">
                      <td className="px-4 py-4">
                        <div className="flex items-start gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
                            {name.slice(0, 1).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 dark:text-white">{name}</p>
                            <p className="truncate text-xs text-gray-500">{user.email}</p>
                            <p className="mt-1 text-[11px] text-gray-400">
                              ID {user.supabaseId.slice(0, 8)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-1.5">
                          <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${ROLE_BADGE[user.role] ?? ROLE_BADGE.MEMBER}`}>
                            {user.role.replace("_", " ")}
                          </span>
                          <div className="flex flex-wrap gap-1">
                            <Badge variant="outline" className={user.isActive ? "text-emerald-700" : "text-gray-500"}>
                              {user.isActive ? "Active" : "Inactive"}
                            </Badge>
                            {user.emailVerified && (
                              <Badge variant="outline" className="gap-1 text-blue-700">
                                <ShieldCheck className="h-3 w-3" />
                                Email verified
                              </Badge>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-1 text-xs text-gray-600 dark:text-gray-300">
                          <p>Phone: {user.phone || "—"}</p>
                          <p>WhatsApp: {user.whatsapp || "—"}</p>
                          <p className="text-gray-400">Prefers {user.preferredContact?.toLowerCase() ?? "not set"}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          <p className="font-semibold text-gray-900 dark:text-white">{user._count.professionals}</p>
                          {primaryListing ? (
                            <div className="text-xs text-gray-500">
                              <p className="max-w-44 truncate">{primaryListing.businessName ?? primaryListing.title ?? primaryListing.category.name}</p>
                              <p>{primaryListing.status} · {totalProfileViews} views</p>
                            </div>
                          ) : (
                            <p className="text-xs text-gray-400">No listings</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-1 text-xs text-gray-500">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{user._count.serviceRequests}</p>
                          <p>{user.openRequests} open</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-1 text-xs text-gray-500">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{user._count.sentMessages}</p>
                          <p>{user.openConversations} open chats</p>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-xs text-gray-500">
                        {formatShortDate(user.createdAt)}
                      </td>
                      <td className="px-4 py-4 text-xs text-gray-500">
                        <p>{formatShortDate(user.lastActivityAt)}</p>
                        <p className="mt-1 text-gray-400">Updated {formatDate(user.updatedAt)}</p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {activeCount < users.length && (
            <div className="border-t border-gray-100 bg-gray-50 px-4 py-3 text-xs text-gray-500 dark:border-gray-800 dark:bg-gray-900/60">
              Showing {users.length} users, including {users.length - activeCount} inactive account{users.length - activeCount === 1 ? "" : "s"}.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
