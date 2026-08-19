import Link from "next/link";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MobileNav } from "./mobile-nav";
import { UserDropdown } from "./user-dropdown";
import { LogoLink } from "./logo-link";

interface NavbarProps {
  user?: {
    firstName?: string | null;
    lastName?: string | null;
    displayName?: string | null;
    email: string;
    role: string;
    isProfessional?: boolean;
    unreadMessageCount?: number;
    adminNotificationCount?: number;
    totalNotificationCount?: number;
    latestUnreadConversationId?: string | null;
  } | null;
}

export function Navbar({ user }: NavbarProps) {
  const displayName = user?.displayName ?? user?.firstName ?? user?.email ?? "User";
  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
  const isProfessional = user?.isProfessional ?? false;

  return (
    <>
      <header className="sticky top-0 z-[100] w-full bg-[#14532d] border-b border-white/10">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 lg:px-6">

          {/* Logo */}
          <LogoLink />

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {[
              { href: "/professionals", label: "Find Professionals" },
              { href: "/categories", label: "Categories" },
              { href: "/events", label: "Events" },
              { href: "/offers", label: "Community Offers" },
              { href: "/request", label: "Service Request" },
              { href: "/advertise", label: "Advertise with us" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="whitespace-nowrap px-3 py-2 rounded-lg text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-all"
              >
                {link.label}
              </Link>
            ))}
            {isAdmin && (
              <Link
                href="/admin"
                className="ml-1 flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white hover:bg-white/10 transition-all"
              >
                <Shield className="h-3.5 w-3.5" />
                Admin
              </Link>
            )}
          </nav>

          {/* Desktop Auth */}
          <div className="hidden lg:flex items-center gap-2">
            {user ? (
              <UserDropdown
                displayName={displayName}
                isAdmin={isAdmin}
                isProfessional={isProfessional}
                unreadMessageCount={user.unreadMessageCount ?? 0}
                adminNotificationCount={user.adminNotificationCount ?? 0}
                totalNotificationCount={user.totalNotificationCount ?? user.unreadMessageCount ?? 0}
                latestUnreadConversationId={user.latestUnreadConversationId ?? null}
              />
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm" className="h-9 text-sm text-white/80 hover:text-white hover:bg-white/10 cursor-pointer">
                    Sign in
                  </Button>
                </Link>
                <Link href="/professionals/register">
                  <Button size="sm" variant="outline" className="h-9 bg-transparent border-white/30 text-white hover:border-white hover:bg-white hover:text-emerald-700 text-sm font-medium cursor-pointer">
                    Join as a professional
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile toggle — isolated client component */}
          <div className="flex items-center gap-1 lg:hidden">
            {user ? (
              <UserDropdown
                displayName={displayName}
                isAdmin={isAdmin}
                isProfessional={isProfessional}
                unreadMessageCount={user.unreadMessageCount ?? 0}
                adminNotificationCount={user.adminNotificationCount ?? 0}
                totalNotificationCount={user.totalNotificationCount ?? user.unreadMessageCount ?? 0}
                latestUnreadConversationId={user.latestUnreadConversationId ?? null}
                compact
              />
            ) : (
              <MobileNav isAdmin={isAdmin} isProfessional={isProfessional} user={null} />
            )}
          </div>
        </div>
      </header>
      {!user && (
        <nav
          aria-label="Quick actions"
          className="sticky top-16 z-[90] border-b border-emerald-100 bg-white/95 px-3 py-2 shadow-sm backdrop-blur lg:hidden"
        >
          <div className="mx-auto grid max-w-xl grid-cols-3 gap-2">
            <Link
              href="/professionals"
              className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-2 text-center text-xs font-semibold text-emerald-800"
            >
              Find
            </Link>
            <Link
              href="/auth/login"
              className="rounded-full border border-gray-200 bg-white px-2.5 py-2 text-center text-xs font-semibold text-gray-700 cursor-pointer"
            >
              Sign in
            </Link>
            <Link
              href="/professionals/register"
              className="rounded-full bg-emerald-600 px-2.5 py-2 text-center text-xs font-semibold text-white shadow-sm cursor-pointer"
            >
              Join
            </Link>
          </div>
        </nav>
      )}
    </>
  );
}
