import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/actions/auth";
import { LayoutDashboard, User, FileText, LogOut, Shield, Sparkles, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login?redirectTo=/dashboard");

  const displayName = user.displayName ?? [user.firstName, user.lastName].filter(Boolean).join(" ") ?? user.email;

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-green-600 text-white font-bold text-xs">MN</div>
            <span className="font-semibold text-sm text-gray-900 dark:text-white">Minaret Network</span>
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-gray-500 dark:text-gray-400 hidden sm:block">{displayName}</span>
            <form action="/auth/signout" method="post">
              <Button variant="ghost" size="sm" className="gap-1.5 text-gray-600">
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:block">Sign Out</span>
              </Button>
            </form>
          </div>
        </div>
      </header>

      {/* Mobile tab bar */}
      <div className="md:hidden border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-x-auto">
        <nav className="flex px-4 gap-1 min-w-max">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-1.5 px-3 py-3 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-green-700 dark:hover:text-green-400 whitespace-nowrap border-b-2 border-transparent hover:border-green-500 transition-colors"
            >
              {link.icon}
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="container mx-auto px-4 py-6 md:py-8 flex gap-8">
        <aside className="w-52 flex-shrink-0 hidden md:block">
          <nav className="space-y-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/10 hover:text-green-700 dark:hover:text-green-400 transition-colors"
              >
                {link.icon}
                {link.label}
              </Link>
            ))}
          </nav>
        </aside>

        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
