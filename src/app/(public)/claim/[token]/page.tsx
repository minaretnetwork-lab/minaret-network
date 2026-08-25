import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getClaimInviteByToken } from "@/lib/actions/claim-invite";
import { ClaimAcceptForm } from "@/components/professionals/claim-accept-form";
import { Building2, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ClaimPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const professional = await getClaimInviteByToken(token);

  if (!professional) {
    return (
      <main className="min-h-[70vh] flex items-center justify-center bg-white dark:bg-gray-950 px-4">
        <div className="max-w-md text-center space-y-4">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20 mx-auto">
            <ShieldCheck className="h-7 w-7 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Link invalid or expired</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            This claim link has already been used, has expired, or doesn&apos;t exist.
            Please contact Minaret Network if you believe this is an error.
          </p>
        </div>
      </main>
    );
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/auth/login?next=/claim/${token}`);
  }

  const displayName =
    professional.businessName ||
    professional.title ||
    "this listing";

  const location = [professional.city, professional.province].filter(Boolean).join(", ");

  return (
    <main className="min-h-[70vh] flex items-center justify-center bg-white dark:bg-gray-950 px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/20 mx-auto">
            <Building2 className="h-7 w-7 text-emerald-700 dark:text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Claim your business listing</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            You&apos;ve been invited to claim ownership of a Minaret Network listing.
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-5 space-y-1">
          <p className="text-lg font-semibold text-gray-900 dark:text-white">{displayName}</p>
          {location && <p className="text-sm text-gray-500 dark:text-gray-400">{location}</p>}
        </div>

        <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/10 px-4 py-3 text-xs text-amber-800 dark:text-amber-300">
          By claiming this listing you confirm you are an authorized representative of this business.
          Misrepresentation may result in removal.
        </div>

        <ClaimAcceptForm token={token} businessName={displayName} />
      </div>
    </main>
  );
}
