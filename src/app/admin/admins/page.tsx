import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/actions/auth";
import { getUsersForAdminManagement } from "@/lib/actions/admins";
import { AdminManagementClient } from "./admins-client";

export const metadata = { title: "Manage Admins | Admin" };

export default async function AdminsPage() {
  const me = await getCurrentUser();
  if (!me || me.role !== "SUPER_ADMIN") redirect("/admin");

  const users = await getUsersForAdminManagement();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Management</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          See every registered user, their combined roles, and manage admin access. Only you
          (Super Admin) can see this page.
        </p>
      </div>

      <AdminManagementClient users={users} />
    </div>
  );
}
