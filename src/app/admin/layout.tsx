import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/actions/auth";
import { getAdminStats } from "@/lib/actions/admin";
import { prisma } from "@/lib/prisma";
import { DEFAULT_MOSQUE_SLUG, CURRENT_TOS_VERSION } from "@/lib/constants";
import {
  LayoutDashboard, Users, MessageSquare,
  FileText, Tag, LogOut, Building2, Sparkles, Star, TrendingUp, ShieldCheck, UserRound, Flag, CalendarDays, Megaphone, ClipboardCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MinaretLogo } from "@/components/ui/minaret-logo";

const navLinks = [
  { href: "/admin", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  { href: "/admin/mosques", label: "Mosques", icon: <Building2 className="h-4 w-4" /> },
  { href: "/admin/users", label: "Users", icon: <UserRound className="h-4 w-4" /> },
  { href: "/admin/professionals", label: "Professionals", icon: <Users className="h-4 w-4" /> },
  { href: "/admin/sponsored", label: "Sponsored", icon: <Sparkles className="h-4 w-4" /> },
  { href: "/admin/featured", label: "Featured Biz", icon: <Star className="h-4 w-4" /> },
  { href: "/admin/events", label: "Events", icon: <CalendarDays className="h-4 w-4" /> },
  { href: "/admin/offers", label: "Comm. Offers", icon: <Megaphone className="h-4 w-4" /> },
  { href: "/admin/claims", label: "Profile Claims", icon: <ClipboardCheck className="h-4 w-4" /> },
  { href: "/admin/recommendations", label: "Recommendations", icon: <MessageSquare className="h-4 w-4" /> },
  { href: "/admin/reports", label: "Review Reports", icon: <Flag className="h-4 w-4" /> },
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
  if (!user.tosVersion || user.tosVersion !== CURRENT_TOS_VERSION) {
    redirect("/auth/re-consent");
  }
  const isSuperAdmin = user.role === "SUPER_ADMIN";
  const [stats, pendingClaimsCount] = await Promise.all([
    getAdminStats(DEFAULT_MOSQUE_SLUG),
    prisma.profileClaim.count({ where: { status: "PENDING" } }),
  ]);
  const pendingProfessionalReviews = stats?.pendingProfessionalReviews ?? stats?.pendingProfessionals ?? 0;
  const pendingRecommendations = stats?.pendingRecommendations ?? 0;
  const openReports = stats?.openReports ?? 0;

  function badgeForHref(href: string) {
    if (href === "/admin/professionals") return pendingProfessionalReviews;
    if (href === "/admin/claims") return pendingClaimsCount;
    if (href === "/admin/recommendations") return pendingRecommendations;
    if (href === "/admin/reports") return openReports;
    return 0;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="bg-green-800 text-white sticky top-0 z-40">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <MinaretLogo withText={false} className="h-7 w-auto" />
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
              <LinkWithBadge
                key={link.href}
                href={link.href}
                icon={link.icon}
                label={link.label}
                badge={badgeForHref(link.href)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/10 hover:text-green-700 dark:hover:text-green-400 transition-colors"
              />
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

        <main className="flex-1 min-w-0">
          <nav className="mb-6 grid grid-cols-2 gap-2 md:hidden" aria-label="Admin sections">
            {navLinks.map((link) => (
              <LinkWithBadge
                key={link.href}
                href={link.href}
                icon={<span className="text-emerald-700">{link.icon}</span>}
                label={link.label}
                badge={badgeForHref(link.href)}
                className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm font-medium text-gray-700 shadow-sm transition hover:border-emerald-200 hover:text-emerald-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
              />
            ))}
            {isSuperAdmin && (
              <Link
                href="/admin/admins"
                className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm font-medium text-amber-800 shadow-sm transition hover:bg-amber-100"
              >
                <ShieldCheck className="h-4 w-4" />
                <span className="min-w-0 truncate">Manage Admins</span>
              </Link>
            )}
          </nav>
          {children}
        </main>
      </div>
    </div>
  );
}

function LinkWithBadge({
  href,
  icon,
  label,
  badge,
  className,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  badge: number;
  className: string;
}) {
  return (
    <Link href={href} className={className}>
      {icon}
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {badge > 0 && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold leading-none text-white">
          {badge > 9 ? "9+" : badge}
        </span>
      )}
    </Link>
  );
}
