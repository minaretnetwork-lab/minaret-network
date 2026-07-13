import Link from "next/link";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MobileNav } from "./mobile-nav";
import { UserDropdown } from "./user-dropdown";

interface NavbarProps {
  user?: {
    firstName?: string | null;
    lastName?: string | null;
    displayName?: string | null;
    email: string;
    role: string;
    isProfessional?: boolean;
  } | null;
}

export function Navbar({ user }: NavbarProps) {
  const displayName = user?.displayName ?? user?.firstName ?? user?.email ?? "User";
  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
  const isProfessional = user?.isProfessional ?? false;

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-[#071a0e] border-b border-white/10">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 lg:px-6">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 flex-shrink-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold text-sm">
              <span style={{ fontFamily: "var(--font-playfair)" }}>MN</span>
            </div>
            <div className="hidden sm:block">
              <span className="text-[15px] font-semibold text-white leading-none" style={{ fontFamily: "var(--font-playfair)" }}>
                Minaret Network
              </span>
              <p className="text-[10px] text-white/40 leading-none mt-0.5 tracking-widest uppercase">
                Mosque Professionals
              </p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {[
              { href: "/professionals", label: "Find Professionals" },
              { href: "/categories", label: "Categories" },
              { href: "/request", label: "Raise a Service Request" },
              { href: "/advertise", label: "Advertise with Us" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-all"
              >
                {link.label}
              </Link>
            ))}
            {isAdmin && (
              <Link
                href="/admin"
                className="ml-1 flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-emerald-400 hover:bg-white/10 transition-all"
              >
                <Shield className="h-3.5 w-3.5" />
                Admin
              </Link>
            )}
          </nav>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <UserDropdown
                displayName={displayName}
                isAdmin={isAdmin}
                isProfessional={isProfessional}
              />
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm" className="h-9 text-sm text-white/70 hover:text-white hover:bg-white/10">
                    Sign in
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button variant="ghost" size="sm" className="h-9 text-sm text-white/70 hover:text-white hover:bg-white/10">
                    Sign up
                  </Button>
                </Link>
                <Link href="/professionals/register">
                  <Button size="sm" className="h-9 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium">
                    Join as Professional
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile toggle — isolated client component */}
          <MobileNav isAdmin={isAdmin} user={user ?? null} />
        </div>
      </header>
    </>
  );
}
