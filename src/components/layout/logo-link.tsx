"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MinaretLogo } from "@/components/ui/minaret-logo";

export function LogoLink() {
  const pathname = usePathname();

  function handleClick(e: React.MouseEvent) {
    if (pathname === "/") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  return (
    <Link href="/" className="flex-shrink-0" onClick={handleClick}>
      <MinaretLogo />
    </Link>
  );
}
