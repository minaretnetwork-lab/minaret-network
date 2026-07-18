import Link from "next/link";
import { MailOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="text-center max-w-md">
        <div className="mb-5 flex justify-center"><MailOpen className="h-16 w-16 text-emerald-500" /></div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Check your email</h1>
        <p className="text-gray-500 dark:text-gray-400 leading-relaxed mb-6">
          We've sent a verification link to your email address. Please check your inbox (and spam folder) and click the link to activate your account.
        </p>
        <Link href="/auth/login">
          <Button variant="outline">Back to Sign In</Button>
        </Link>
      </div>
    </div>
  );
}
