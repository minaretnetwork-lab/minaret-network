"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";

const MESSAGES: Record<string, { message: string; type: "success" | "info" }> = {
  bye: { message: "You've been signed out. See you soon!", type: "success" },
};

export function FlashToast() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    for (const [key, { message, type }] of Object.entries(MESSAGES)) {
      if (searchParams.get(key) !== null) {
        toast[type](message, { position: "bottom-right", duration: 4000 });
        // Clean the param from the URL without a page reload
        const params = new URLSearchParams(searchParams.toString());
        params.delete(key);
        const newUrl = params.size ? `${pathname}?${params}` : pathname;
        router.replace(newUrl, { scroll: false });
        break;
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
