"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

export function ListingManagerGuard({ role }: { role: string }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (role !== "LISTING_MANAGER") return;
    if (!pathname.startsWith("/admin/professionals")) {
      router.replace("/admin/professionals");
    }
  }, [pathname, role, router]);

  return null;
}
