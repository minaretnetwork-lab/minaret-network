import { getUsersForAdmin } from "@/lib/actions/admin";
import { AdminUsersTable, type AdminUserRow } from "@/components/admin/users-table";

export const metadata = { title: "Users" };

export default async function AdminUsersPage() {
  const users = await getUsersForAdmin();
  const rows: AdminUserRow[] = users.map((user) => ({
    ...user,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    lastActivityAt: user.lastActivityAt.toISOString(),
  }));

  return <AdminUsersTable users={rows} />;
}
