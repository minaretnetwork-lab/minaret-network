"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("PublicLayout error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center px-4">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Something went wrong</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
        {error.message || "An unexpected error occurred. Please try again."}
      </p>
      {error.digest && (
        <p className="text-xs text-gray-400 font-mono">digest: {error.digest}</p>
      )}
      <Button onClick={reset} variant="outline" size="sm">Try again</Button>
    </div>
  );
}
