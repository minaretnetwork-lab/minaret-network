import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/actions/auth";
import { Star, Sparkles } from "lucide-react";

export const metadata = { title: "Featured Business" };

export default async function FeaturedDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Featured Business</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Featured business placements are coming soon.
        </p>
      </div>

      <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-8 text-center shadow-sm dark:border-amber-900/40 dark:bg-amber-950/20">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white text-amber-700 shadow-sm dark:bg-gray-900 dark:text-amber-300">
          <Star className="h-7 w-7" />
        </div>
        <p className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-700 shadow-sm dark:bg-gray-900 dark:text-amber-300">
          <Sparkles className="h-3.5 w-3.5" />
          Coming soon
        </p>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Featured business applications are not open yet</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-gray-600 dark:text-gray-400">
          We&apos;re still setting up self-serve featured placements. For now, Minaret admins will manage featured businesses directly.
        </p>
      </div>
    </div>
  );
}
