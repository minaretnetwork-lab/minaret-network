"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Building2, CheckCircle, Loader2, X } from "lucide-react";
import Link from "next/link";

interface Props {
  professionalId: string;
  isLoggedIn: boolean;
  currentUserEmail?: string | null;
  currentUserName?: string | null;
  alreadyClaimed?: boolean;
}

export function ClaimProfileBanner({
  professionalId,
  isLoggedIn,
  currentUserEmail,
  currentUserName,
  alreadyClaimed,
}: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(currentUserName ?? "");
  const [email, setEmail] = useState(currentUserEmail ?? "");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [consentGiven, setConsentGiven] = useState(false);

  if (alreadyClaimed) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/professionals/${professionalId}/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          claimantName: name,
          claimantEmail: email,
          claimantPhone: phone || null,
          claimantNote: note,
          consentGiven,
        }),
      });
      const data = await res.json();
      if (!data.ok) { setError(data.error ?? "Something went wrong."); return; }
      setSuccess(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mb-4 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 p-4">
      {success ? (
        <div className="flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">Claim submitted!</p>
            <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-0.5">
              We&apos;ll contact you at {email} to verify ownership before granting access.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <Building2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">Is this your business?</p>
                <p className="text-sm text-emerald-700 dark:text-emerald-300">
                  Claim this profile to manage your listing, add photos, and connect with the community.
                </p>
              </div>
            </div>
            {!open && (
              isLoggedIn ? (
                <Button
                  size="sm"
                  onClick={() => setOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
                >
                  Claim profile
                </Button>
              ) : (
                <Link
                  href={`/auth/register?next=/professionals/${professionalId}`}
                  className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-3 py-1.5 transition-colors"
                >
                  Sign in to claim
                </Link>
              )
            )}
          </div>

          {open && (
            <form onSubmit={handleSubmit} className="mt-4 space-y-4 border-t border-emerald-200 dark:border-emerald-700 pt-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
                  Tell us how you&apos;re connected to this business
                </p>
                <button type="button" onClick={() => setOpen(false)} className="text-emerald-600 hover:text-emerald-800">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="claim-name" className="text-xs">Your name *</Label>
                  <Input
                    id="claim-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="text-sm"
                    placeholder="Full name"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="claim-email" className="text-xs">Contact email *</Label>
                  <Input
                    id="claim-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="text-sm"
                    placeholder="you@example.com"
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label htmlFor="claim-phone" className="text-xs">Phone (optional)</Label>
                  <Input
                    id="claim-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="text-sm"
                    placeholder="+1 (416) 555-0100"
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label htmlFor="claim-note" className="text-xs">How are you connected to this business? *</Label>
                  <Textarea
                    id="claim-note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    required
                    minLength={20}
                    rows={3}
                    className="text-sm"
                    placeholder="e.g. I am the owner / founder. My business website is…"
                  />
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              )}

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentGiven}
                  onChange={(e) => setConsentGiven(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 shrink-0"
                  required
                />
                <span className="text-xs text-emerald-700 dark:text-emerald-400 leading-relaxed">
                  I confirm I am 18 years of age or older and I agree to Minaret Network&apos;s{" "}
                  <Link href="/terms" className="underline underline-offset-2 hover:text-emerald-600">Terms of Service</Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="underline underline-offset-2 hover:text-emerald-600">Privacy Policy</Link>.
                  I understand that Minaret Network is a community directory and not a professional verification service.
                </span>
              </label>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  size="sm"
                  disabled={loading || !consentGiven}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {loading && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}
                  Submit claim
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </>
      )}
    </div>
  );
}
