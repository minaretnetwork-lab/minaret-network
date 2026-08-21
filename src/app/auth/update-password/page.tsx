"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { MinaretLogo } from "@/components/ui/minaret-logo";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState<"loading" | "ok" | "expired">("loading");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    createClient().auth.getSession().then(({ data }) => {
      setReady(data.session ? "ok" : "expired");
    });
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmation) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setSubmitting(false);
      setError(updateError.message);
      return;
    }

    await supabase.auth.signOut();
    router.replace("/auth/login?password=updated");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="mb-6 inline-flex items-center gap-2">
            <MinaretLogo variant="light" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Choose a new password
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Enter a new password for your Minaret account.
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          {ready === "loading" && (
            <p className="text-center text-sm text-gray-400">Verifying reset link…</p>
          )}

          {ready === "expired" && (
            <div className="space-y-4 text-center">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                This reset link has expired or has already been used. Please request a new one.
              </p>
              <Link
                href="/auth/forgot-password"
                className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-green-600 text-sm font-semibold text-white hover:bg-green-700"
              >
                Request a new link
              </Link>
              <Link
                href="/auth/login"
                className="block text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                Back to sign in
              </Link>
            </div>
          )}

          {ready === "ok" && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="password">New password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="mt-1.5"
                  autoComplete="new-password"
                  required
                />
              </div>
              <div>
                <Label htmlFor="confirmation">Confirm new password</Label>
                <Input
                  id="confirmation"
                  type="password"
                  value={confirmation}
                  onChange={(event) => setConfirmation(event.target.value)}
                  className="mt-1.5"
                  autoComplete="new-password"
                  required
                />
              </div>
              {error && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20">
                  {error}
                </p>
              )}
              <Button
                type="submit"
                disabled={submitting}
                className="h-11 w-full bg-green-600 text-white hover:bg-green-700"
              >
                {submitting ? "Updating..." : "Update password"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
