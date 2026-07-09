import Link from "next/link";
import { Shield, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MobileNav } from "./mobile-nav";

interface NavbarProps {
  user?: {
    firstName?: string | null;
    lastName?: string | null;
    displayName?: string | null;
    email: string;
    role: string;
  } | null;
}

export function Navbar({ user }: NavbarProps) {
  const displayName = user?.displayName ?? user?.firstName ?? user?.email;
  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

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
              { href: "/request", label: "Request Help" },
              { href: "/advertise", label: "Advertise" },
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
              <>
                <Link href="/dashboard">
                  <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-white/80 hover:bg-white/10 transition-colors">
                    <div className="h-7 w-7 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-bold">
                      {(displayName?.[0] ?? "U").toUpperCase()}
                    </div>
                    <span className="max-w-[120px] truncate">{displayName}</span>
                    <ChevronDown className="h-3.5 w-3.5 text-white/40" />
                  </button>
                </Link>
                <form action="/auth/signout" method="post">
                  <Button variant="outline" size="sm" className="h-9 text-xs border-white/20 text-white hover:bg-white/10 bg-transparent">
                    Sign out
                  </Button>
                </form>
              </>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm" className="h-9 text-sm text-white/70 hover:text-white hover:bg-white/10">
                    Sign in
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
