"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { reAcceptTos } from "@/lib/actions/auth";

export default function ReConsentPage() {
  const [ageChecked, setAgeChecked] = useState(false);
  const [tosChecked, setTosChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleAccept() {
    if (!ageChecked || !tosChecked) return;
    setBusy(true);
    setError("");
    try {
      await reAcceptTos();
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8 shadow-sm">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Updated Terms &amp; Privacy Policy
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            We&apos;ve updated our Terms of Service and Privacy Policy. Please review and re-accept them to continue using Minaret Network.
          </p>

          <div className="space-y-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4 mb-6">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={ageChecked}
                onChange={(e) => setAgeChecked(e.target.checked)}
                className="mt-0.5 flex-shrink-0 rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                I confirm I am <strong>18 years of age or older</strong>
              </span>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={tosChecked}
                onChange={(e) => setTosChecked(e.target.checked)}
                className="mt-0.5 flex-shrink-0 rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                I agree to the{" "}
                <Link href="/terms" className="text-green-700 hover:underline">Terms of Service</Link>
                {" "}and{" "}
                <Link href="/privacy" className="text-green-700 hover:underline">Privacy Policy</Link>
              </span>
            </label>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
              {error}
            </p>
          )}

          <Button
            onClick={handleAccept}
            disabled={!ageChecked || !tosChecked || busy}
            className="w-full bg-green-600 hover:bg-green-700 text-white h-11"
          >
            {busy ? "Saving…" : "Accept and Continue"}
          </Button>
        </div>
      </div>
    </div>
  );
}
