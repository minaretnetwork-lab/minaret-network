import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/actions/auth";
import { ProfileForm } from "@/components/dashboard/profile-form";

export const metadata = { title: "My Profile" };

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Profile</h1>
      <ProfileForm
        defaultValues={{
          firstName: user.firstName ?? "",
          lastName: user.lastName ?? "",
          email: user.email,
          phone: user.phone ?? "",
          whatsapp: user.whatsapp ?? "",
          preferredContact: user.preferredContact ?? undefined,
        }}
      />
    </div>
  );
}
