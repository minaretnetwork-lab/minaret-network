import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/actions/auth";
import { LayoutDashboard, User, FileText, Shield, Sparkles, Star } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login?redirectTo=/dashboard");

  const links = [
    { href: "/dashboard", label: "Overview", icon: <LayoutDashboard className="h-4 w-4" /> },
    { href: "/dashboard/profile", label: "My Profile", icon: <User className="h-4 w-4" /> },
    { href: "/dashboard/requests", label: "My Requests", icon: <FileText className="h-4 w-4" /> },
    ...(user.role === "PROFESSIONAL" || user.professional ? [
      { href: "/dashboard/professional", label: "Professional Profile", icon: <Shield className="h-4 w-4" /> },
      { href: "/dashboard/promote", label: "Sponsored Listing", icon: <Sparkles className="h-4 w-4" /> },
      { href: "/dashboard/featured", label: "Featured Business", icon: <Star className="h-4 w-4" /> },
    ] : []),
    ...(user.role === "ADMIN" || user.role === "SUPER_ADMIN" ? [
      { href: "/admin", label: "Admin Panel", icon: <Shield className="h-4 w-4" /> },
    ] : []),
  ];

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-950">
      <Navbar
        user={{
          firstName: user.firstName,
          lastName: user.lastName,
          displayName: user.displayName,
          email: user.email,
          role: user.role,
          isProfessional: !!user.professional,
        }}
      />

      {/* Mobile tab bar */}
      <div className="md:hidden border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-x-auto">
        <nav className="flex px-4 gap-1 min-w-max">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-1.5 px-3 py-3 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-[#14532d] whitespace-nowrap border-b-2 border-transparent hover:border-[#14532d] transition-colors"
            >
              {link.icon}
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="container mx-auto px-4 py-6 md:py-8 flex gap-8 flex-1">
        <aside className="w-52 flex-shrink-0 hidden md:block">
          <nav className="space-y-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 hover:text-[#14532d] dark:hover:text-emerald-400 transition-colors"
              >
                {link.icon}
                {link.label}
              </Link>
            ))}
          </nav>
        </aside>

        <main className="flex-1 min-w-0">{children}</main>
      </div>

      <Footer />
    </div>
  );
}
