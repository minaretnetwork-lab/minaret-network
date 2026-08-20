"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { MinaretLogo } from "@/components/ui/minaret-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  useEffect(() => { document.title = "Reset Password | Minaret Network"; }, []);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    const callback = new URL("/auth/callback", window.location.origin);
    callback.searchParams.set("next", "/auth/update-password");
    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      { redirectTo: callback.toString() },
    );

    setSubmitting(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }
    setSent(true);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="mb-6 inline-flex items-center gap-2">
            <MinaretLogo variant="light" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Reset your password
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            We will send a secure reset link to your email.
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          {sent ? (
            <div className="space-y-5">
              <p className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300">
                If that account exists, a password-reset message is ready. In
                this local experiment, open Mailpit at localhost:54324 to view
                it.
              </p>
              <Link
                href="/auth/login"
                className="flex h-11 w-full items-center justify-center rounded-lg border border-gray-200 text-sm font-medium hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
              >
                Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="mt-1.5"
                  placeholder="you@example.com"
                  autoComplete="email"
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
                {submitting ? "Sending..." : "Send reset link"}
              </Button>
              <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                <Link href="/auth/login" className="font-medium text-green-700 hover:underline">
                  Back to sign in
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
