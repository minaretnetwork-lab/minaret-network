import { redirect } from "next/navigation";
import Link from "next/link";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { CURRENT_TOS_VERSION } from "@/lib/constants";
import { reAcceptTos } from "@/lib/actions/auth";
import { ReConsentSubmitButton } from "./submit-button";

export default async function ReConsentPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { next } = await searchParams;
  const cookieStore = await cookies();
  const oauthNext = cookieStore.get("mn_oauth_next")?.value ?? "";
  const nextUrl = (next && next.startsWith("/") && next !== "/dashboard")
    ? next
    : (oauthNext.startsWith("/") ? oauthNext : "/dashboard");

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    select: { tosVersion: true },
  });
  const isFirstTime = !dbUser?.tosVersion;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4 py-12">
      <div className="w-full max-w-md">
        <form action={reAcceptTos} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8 shadow-sm">
          <input type="hidden" name="next" value={nextUrl} />
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {isFirstTime ? "Before you continue" : "Updated Terms & Privacy Policy"}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            {isFirstTime
              ? "Please confirm the following before using Minaret Network."
              : `We've updated our Terms of Service and Privacy Policy (version ${CURRENT_TOS_VERSION}). Please review and re-accept them to continue.`}
          </p>

          <div className="space-y-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4 mb-6">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                name="ageAttested"
                required
                className="mt-0.5 flex-shrink-0 rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                I confirm I am <strong>18 years of age or older</strong>.
              </span>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                name="tosAccepted"
                required
                className="mt-0.5 flex-shrink-0 rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                I agree to the{" "}
                <Link href="/terms" target="_blank" rel="noopener noreferrer" className="text-green-700 underline hover:text-green-900">
                  Terms of Service
                </Link>
                {" "}and{" "}
                <Link href="/privacy" target="_blank" rel="noopener noreferrer" className="text-green-700 underline hover:text-green-900">
                  Privacy Policy
                </Link>.
              </span>
            </label>
          </div>

          <ReConsentSubmitButton />
        </form>
      </div>
    </div>
  );
}
