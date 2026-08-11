import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/actions/auth";
import {
  LayoutDashboard, Users, MessageSquare,
  FileText, Tag, LogOut, Building2, Sparkles, Star, TrendingUp, ShieldCheck, UserRound
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navLinks = [
  { href: "/admin", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  { href: "/admin/mosques", label: "Mosques", icon: <Building2 className="h-4 w-4" /> },
  { href: "/admin/users", label: "Users", icon: <UserRound className="h-4 w-4" /> },
  { href: "/admin/professionals", label: "Professionals", icon: <Users className="h-4 w-4" /> },
  { href: "/admin/sponsored", label: "Sponsored", icon: <Sparkles className="h-4 w-4" /> },
  { href: "/admin/featured", label: "Featured Biz", icon: <Star className="h-4 w-4" /> },
  { href: "/admin/recommendations", label: "Recommendations", icon: <MessageSquare className="h-4 w-4" /> },
  { href: "/admin/requests", label: "Service Requests", icon: <FileText className="h-4 w-4" /> },
  { href: "/admin/categories", label: "Categories", icon: <Tag className="h-4 w-4" /> },
  { href: "/admin/category-suggestions", label: "Category Requests", icon: <Tag className="h-4 w-4" /> },
  { href: "/admin/revenue", label: "Mosque Revenue", icon: <TrendingUp className="h-4 w-4" /> },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
    redirect("/dashboard");
  }
  const isSuperAdmin = user.role === "SUPER_ADMIN";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="bg-green-800 text-white sticky top-0 z-40">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-white font-bold text-xs">MN</div>
            </Link>
            <span className="text-sm font-semibold">Admin Panel</span>
            <span className="text-white/30 text-xs">|</span>
            <Link href="/dashboard" className="text-xs text-white/60 hover:text-white transition-colors">
              My Dashboard
            </Link>
            <span className="text-white/30 text-xs">|</span>
            <Link href="/" className="text-xs text-white/60 hover:text-white transition-colors">
              Back to site
            </Link>
          </div>
          <form action="/auth/signout" method="post">
            <Button type="submit" variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/10 gap-1.5">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:block">Sign Out</span>
            </Button>
          </form>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 flex gap-8">
        <aside className="w-52 flex-shrink-0 hidden md:block">
          <nav className="space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/10 hover:text-green-700 dark:hover:text-green-400 transition-colors"
              >
                {link.icon}
                {link.label}
              </Link>
            ))}
            {isSuperAdmin && (
              <Link
                href="/admin/admins"
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-colors font-medium"
              >
                <ShieldCheck className="h-4 w-4" />
                Manage Admins
              </Link>
            )}
          </nav>
        </aside>

        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
