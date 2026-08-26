import Link from "next/link";
import { MailOpen, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ blocked?: string; error?: string }>;
}) {
  const params = await searchParams;
  const isBlocked = params.blocked === "1";
  const isLinkExpired = params.error === "link_expired";

  if (isLinkExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
        <div className="text-center max-w-md">
          <div className="mb-5 flex justify-center">
            <AlertTriangle className="h-16 w-16 text-amber-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            Verification link didn&apos;t work
          </h1>
          <p className="text-gray-500 dark:text-gray-400 leading-relaxed mb-2">
            This usually happens when you open the verification link in a different browser or device than the one you signed up on.
          </p>
          <p className="text-gray-500 dark:text-gray-400 leading-relaxed mb-6">
            Please open the link on the same browser where you created your account, or sign in below — if your email is already verified you&apos;ll go straight to your dashboard.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/auth/login">
              <Button className="bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto">Sign in</Button>
            </Link>
            <Link href="/auth/signup">
              <Button variant="outline" className="w-full sm:w-auto">Create a new account</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="text-center max-w-md">
        <div className="mb-5 flex justify-center">
          <MailOpen className="h-16 w-16 text-emerald-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          {isBlocked ? "Email not yet verified" : "Check your email"}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 leading-relaxed mb-6">
          {isBlocked
            ? "Your account exists but your email address hasn't been verified yet. Please check your inbox and spam folder for the verification link we sent you, then click it to activate your account."
            : "We've sent a verification link to your email address. Please check your inbox (and spam folder) and click the link to activate your account."}
        </p>
        <Link href="/auth/login">
          <Button variant="outline">Back to Sign In</Button>
        </Link>
      </div>
    </div>
  );
}
