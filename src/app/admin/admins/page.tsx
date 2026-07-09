import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/actions/auth";
import { getAdmins } from "@/lib/actions/admins";
import { Shield, Crown } from "lucide-react";
import { AdminsClient } from "./admins-client";

export const metadata = { title: "Manage Admins | Admin" };

export default async function AdminsPage() {
  const me = await getCurrentUser();
  if (!me || me.role !== "SUPER_ADMIN") redirect("/admin");

  const admins = await getAdmins();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Management</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Grant or revoke admin access to users. Only you (Super Admin) can see this page.
        </p>
      </div>

      {/* Current admins */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
          <Shield className="h-4 w-4 text-emerald-600" />
          <h2 className="font-semibold text-gray-900 dark:text-white text-sm">Current Admins</h2>
          <span className="ml-auto text-xs text-gray-400">{admins.length} total</span>
        </div>

        {admins.length === 0 ? (
          <div className="px-5 py-10 text-center text-gray-400 text-sm">No admins yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100 dark:border-gray-800">
                <th className="text-left px-5 py-3">User</th>
                <th className="text-left px-5 py-3">Role</th>
                <th className="text-left px-5 py-3">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {admins.map((admin) => (
                <tr key={admin.id} className="border-b border-gray-50 dark:border-gray-800/50">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-xs font-bold text-emerald-700 dark:text-emerald-400 flex-shrink-0">
                        {((admin.displayName ?? admin.firstName ?? admin.email ?? "?")?.[0] ?? "?").toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {admin.displayName ?? ([admin.firstName, admin.lastName].filter(Boolean).join(" ") || "—")}
                        </p>
                        <p className="text-xs text-gray-400">{admin.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    {admin.role === "SUPER_ADMIN" ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full">
                        <Crown className="h-3 w-3" /> Super Admin
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
                        <Shield className="h-3 w-3" /> Admin
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${admin.isActive ? "text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-900/20" : "text-gray-400 bg-gray-100 dark:bg-gray-800"}`}>
                      {admin.isActive ? "Active" : "Suspended"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    {admin.role !== "SUPER_ADMIN" && (
                      <AdminsClient.RowActions admin={admin} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add admin */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
        <h2 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">Grant Admin Access</h2>
        <p className="text-xs text-gray-400 mb-4">Search for a registered user by name or email and promote them to admin.</p>
        <AdminsClient.AddAdmin />
      </div>
    </div>
  );
}
