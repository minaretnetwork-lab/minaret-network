"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MinaretLogo } from "@/components/ui/minaret-logo";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

const schema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type FormData = z.infer<typeof schema>;

const googleAuthEnabled = process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true";

function LoginForm() {
  const [error, setError] = useState("");
  const [focusedField, setFocusedField] = useState<keyof FormData | null>(null);
  const [lastGoogleEmail, setLastGoogleEmail] = useState<string | null>(null);

  useEffect(() => {
    const match = document.cookie.match(/(?:^|;\s*)mn_last_google_email=([^;]+)/);
    if (match) setLastGoogleEmail(decodeURIComponent(match[1]));
  }, []);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/dashboard";
  const idleSignOut = searchParams.get("reason") === "idle";
  const passwordUpdated = searchParams.get("password") === "updated";
  const emailVerified = searchParams.get("verified") === "1";

  const clearedOnFocusRef = useRef({ email: false, password: false });

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });
  const emailField = register("email");
  const passwordField = register("password");

  function clearOnFirstFocus(field: keyof FormData, input: HTMLInputElement) {
    setFocusedField(field);
    if (clearedOnFocusRef.current[field]) return;

    clearedOnFocusRef.current[field] = true;
    input.value = "";
    setValue(field, "", { shouldDirty: true, shouldValidate: false });
  }

  async function completePendingChat() {
    const pendingRaw = window.sessionStorage.getItem("minaret_ai_pending_chat");
    if (!pendingRaw) return null;

    try {
      const pending = JSON.parse(pendingRaw) as {
        professionalId?: string;
        issue?: string;
        location?: string;
      };
      if (!pending.professionalId || !pending.issue) return null;

      const response = await fetch("/api/ai/start-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pending),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Could not start the chat.");
      window.sessionStorage.removeItem("minaret_ai_pending_chat");
      return typeof payload.chatUrl === "string" ? payload.chatUrl : null;
    } catch (err) {
      window.sessionStorage.removeItem("minaret_ai_pending_chat");
      setError(err instanceof Error ? err.message : "Signed in, but could not start the chat.");
      return null;
    }
  }

  async function onSubmit(data: FormData) {
    try {
      setError("");
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      if (authError) throw new Error(authError.message);
      const pendingChatUrl = await completePendingChat();
      router.push(pendingChatUrl ?? redirectTo);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    }
  }

  async function handleGoogleLogin() {
    if (!googleAuthEnabled) return;

    if (redirectTo && redirectTo !== "/dashboard") {
      try { localStorage.setItem("mn_oauth_next", JSON.stringify({next: redirectTo, ts: Date.now()})); } catch {}
    }
    window.location.href = `/auth/google?next=${encodeURIComponent(redirectTo)}`;
  }

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8 shadow-sm">
      {emailVerified && (
        <div className="mb-5 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-4 py-3 text-sm text-green-800 dark:text-green-300">
          Your email has been verified. Sign in to get started.
        </div>
      )}
      {idleSignOut && (
        <div className="mb-5 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
          You were signed out after 60 minutes of inactivity.
        </div>
      )}
      {passwordUpdated && (
        <div className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300">
          Your password was updated. Sign in with the new password.
        </div>
      )}
      {lastGoogleEmail && googleAuthEnabled && (
        <div className="mb-3 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 p-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <svg aria-hidden="true" className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 dark:text-gray-400">Last signed in as</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{lastGoogleEmail}</p>
            </div>
          </div>
          <Button type="button" size="sm" onClick={handleGoogleLogin} className="flex-shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 h-8">
            Continue
          </Button>
        </div>
      )}
      <Button
        type="button"
        variant="outline"
        onClick={handleGoogleLogin}
        disabled={!googleAuthEnabled}
        aria-describedby={!googleAuthEnabled ? "google-login-availability" : undefined}
        className="w-full h-11"
      >
        <svg aria-hidden="true" className="h-4 w-4 mr-2" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        {googleAuthEnabled ? "Continue with Google" : "Google sign-in unavailable"}
      </Button>
      {!googleAuthEnabled && (
        <p id="google-login-availability" className="mt-2 text-center text-xs text-gray-500 dark:text-gray-400">
          Google sign-in will be available after configuration.
        </p>
      )}

      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200 dark:border-gray-800" />
        </div>
        <div className="relative flex justify-center text-xs text-gray-400">
          <span className="bg-white dark:bg-gray-900 px-3">or sign in with email</span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            {...emailField}
            onFocus={(event) => clearOnFirstFocus("email", event.currentTarget)}
            onBlur={() => setFocusedField(null)}
            className="mt-1.5"
            placeholder={focusedField === "email" ? "" : "you@example.com"}
          />
          {errors.email && <p role="alert" className="text-xs text-red-600 mt-1">{errors.email.message}</p>}
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <Label htmlFor="password">Password</Label>
            <Link href="/auth/forgot-password" className="text-xs text-green-700 hover:underline">Forgot password?</Link>
          </div>
          <Input
            id="password"
            type="password"
            {...passwordField}
            onFocus={(event) => clearOnFirstFocus("password", event.currentTarget)}
            onBlur={() => setFocusedField(null)}
            placeholder={focusedField === "password" ? "" : "••••••••"}
          />
          {errors.password && <p role="alert" className="text-xs text-red-600 mt-1">{errors.password.message}</p>}
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <Button type="submit" disabled={isSubmitting} className="w-full bg-green-600 hover:bg-green-700 text-white h-11">
          {isSubmitting ? "Signing in…" : "Sign In"}
        </Button>
      </form>

      <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
        Don&apos;t have an account?{" "}
        <Link href={`/auth/signup${redirectTo !== "/dashboard" ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ""}`} className="text-green-700 hover:underline font-medium">Sign up</Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  useEffect(() => { document.title = "Sign In | Minaret Network"; }, []);
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <MinaretLogo variant="light" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome back</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Sign in to your account</p>
        </div>
        <Suspense fallback={<div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8 shadow-sm h-64 animate-pulse" />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
