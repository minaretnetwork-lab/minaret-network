"use client";

import Link from "next/link";
import { Shield, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MobileNavProps {
  isAdmin: boolean;
  user?: {
    displayName?: string | null;
    firstName?: string | null;
    email: string;
  } | null;
}

export function MobileNav({ isAdmin, user }: MobileNavProps) {
  const displayName = user?.displayName ?? user?.firstName ?? user?.email;

  return (
    <details className="md:hidden group">
      <summary
        className="flex items-center justify-center h-10 w-10 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-50 cursor-pointer select-none [&::-webkit-details-marker]:hidden"
        style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent", listStyle: "none" }}
      >
        <Menu className="h-6 w-6 group-open:hidden" />
        <X className="h-6 w-6 hidden group-open:block" />
      </summary>

      <div className="fixed inset-x-0 top-16 z-50 bg-white border-b border-gray-100 shadow-lg">
        <div className="container mx-auto px-4 py-5 flex flex-col gap-1">
          {[
            { href: "/professionals", label: "Find Professionals" },
            { href: "/categories", label: "Categories" },
            { href: "/request", label: "Request help" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="py-3 px-3 rounded-lg text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors"
            >
              {link.label}
            </Link>
          ))}

          {isAdmin && (
            <Link
              href="/admin"
              className="py-3 px-3 rounded-lg text-base font-medium text-emerald-700 hover:bg-emerald-50 flex items-center gap-2 transition-colors"
            >
              <Shield className="h-4 w-4" /> Admin Panel
            </Link>
          )}

          <div className="mt-3 pt-4 border-t border-gray-100 flex flex-col gap-1">
            {user ? (
              <>
                <div className="flex items-center gap-2 px-3 py-2 mb-1">
                  <div className="h-7 w-7 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {(displayName?.[0] ?? "U").toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-gray-800 truncate">{displayName}</span>
                </div>
                {[
                  { href: "/dashboard", label: "My Dashboard" },
                  { href: "/dashboard/profile", label: "My Profile" },
                  { href: "/dashboard/requests", label: "My Requests" },
                ].map((link) => (
                  <Link key={link.href} href={link.href}
                    className="py-2.5 px-3 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors">
                    {link.label}
                  </Link>
                ))}
                {isAdmin && (
                  <Link href="/admin"
                    className="py-2.5 px-3 rounded-lg text-sm font-medium text-emerald-700 hover:bg-emerald-50 transition-colors">
                    Admin Panel
                  </Link>
                )}
                <form action="/auth/signout" method="post" className="mt-2">
                  <Button variant="outline" size="sm" className="w-full border-gray-200 text-gray-700">
                    Sign out
                  </Button>
                </form>
              </>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="outline" size="sm" className="w-full border-gray-200 text-gray-700">
                    Sign in
                  </Button>
                </Link>
                <Link href="/professionals/register">
                  <Button size="sm" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white">
                    Join as Professional
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </details>
  );
}
