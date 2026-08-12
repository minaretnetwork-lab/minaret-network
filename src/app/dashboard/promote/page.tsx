import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/actions/auth";
import { Megaphone, Sparkles } from "lucide-react";

export const metadata = { title: "Promote Your Business" };

export default async function PromotePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Promote Your Business</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Sponsored placements are coming soon.
        </p>
      </div>

      <div className="rounded-2xl border border-violet-100 bg-violet-50/70 p-8 text-center shadow-sm dark:border-violet-900/40 dark:bg-violet-950/20">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white text-violet-700 shadow-sm dark:bg-gray-900 dark:text-violet-300">
          <Megaphone className="h-7 w-7" />
        </div>
        <p className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-violet-700 shadow-sm dark:bg-gray-900 dark:text-violet-300">
          <Sparkles className="h-3.5 w-3.5" />
          Coming soon
        </p>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Sponsored listings are not open yet</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-gray-600 dark:text-gray-400">
          We&apos;re still setting up self-serve sponsored placements. For now, Minaret admins will manage any sponsored listings directly.
        </p>
      </div>
    </div>
  );
}
