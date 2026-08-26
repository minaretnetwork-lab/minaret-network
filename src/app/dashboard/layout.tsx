import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/actions/auth";
import { CURRENT_TOS_VERSION } from "@/lib/constants";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { getAccountNavigation } from "@/components/layout/account-navigation";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login?redirectTo=/dashboard");

  // Redirect to re-consent page if user hasn't accepted the current ToS version
  if (!user.tosVersion || user.tosVersion !== CURRENT_TOS_VERSION) {
    redirect("/auth/re-consent");
  }

  const hasProfessionalListings = user.professionals.length > 0;
  const navGroups = getAccountNavigation({
    isAdmin: user.role === "ADMIN" || user.role === "SUPER_ADMIN" || user.role === "LISTING_MANAGER",
    isProfessional: user.role === "PROFESSIONAL" || hasProfessionalListings,
    messageHref: user.latestUnreadConversationId ? `/dashboard/messages/${user.latestUnreadConversationId}` : "/dashboard/messages",
    messageBadge: user.unreadMessageCount,
  });
  const flatLinks = navGroups.flatMap((group) => group.items);

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-950">
      <Navbar
        user={{
          firstName: user.firstName,
          lastName: user.lastName,
          displayName: user.displayName,
          email: user.email,
          role: user.role,
          isProfessional: hasProfessionalListings,
          unreadMessageCount: user.unreadMessageCount,
          latestUnreadConversationId: user.latestUnreadConversationId,
        }}
      />

      {/* Mobile tab bar */}
      <div className="md:hidden border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-x-auto">
        <nav className="flex px-4 gap-1 min-w-max">
          {flatLinks.map((link) => {
            const Icon = link.icon;
            return (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-1.5 px-3 py-3 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-[#14532d] whitespace-nowrap border-b-2 border-transparent hover:border-[#14532d] transition-colors"
            >
              <Icon className="h-4 w-4" />
              {link.label}
            </Link>
            );
          })}
        </nav>
      </div>

      <div className="container mx-auto px-4 py-6 md:py-8 flex gap-8 flex-1">
        <aside className="w-52 flex-shrink-0 hidden md:block">
          <nav className="space-y-5">
            {navGroups.map((group) => (
              <div key={group.id} className="space-y-1">
                <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400">
                  {group.label}
                </p>
                {group.items.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 hover:text-[#14532d] dark:hover:text-emerald-400 transition-colors"
                    >
                      <Icon className="h-4 w-4" />
                      {link.label}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>
        </aside>

        <main className="flex-1 min-w-0">{children}</main>
      </div>

      <Footer />
    </div>
  );
}
