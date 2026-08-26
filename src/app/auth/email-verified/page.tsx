import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Email Verified — Minaret Network" };

export default async function EmailVerifiedPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const next = params.next?.startsWith("/") ? params.next : "/dashboard";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="text-center max-w-md">
        <div className="mb-5 flex justify-center">
          <div className="rounded-full bg-emerald-100 dark:bg-emerald-900/30 p-5">
            <CheckCircle className="h-14 w-14 text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          Email verified!
        </h1>
        <p className="text-gray-500 dark:text-gray-400 leading-relaxed mb-8">
          Your account is now active. Welcome to Minaret Network — you can sign in and start exploring professionals from your mosque community.
        </p>
        <Link href={next}>
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white px-8">
            Go to your dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
