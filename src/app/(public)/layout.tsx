import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { getCurrentUser } from "@/lib/actions/auth";
import { AnalyticsTracker } from "@/components/analytics-tracker";
import { Suspense } from "react";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser().catch(() => null);

  return (
    <div className="flex min-h-full flex-col">
      <Navbar
        user={
          user
            ? {
                firstName: user.firstName,
                lastName: user.lastName,
                displayName: user.displayName,
                email: user.email,
                role: user.role,
                isProfessional: user.professionals.length > 0,
                unreadMessageCount: user.unreadMessageCount,
                latestUnreadConversationId: user.latestUnreadConversationId,
              }
            : null
        }
      />
      <Suspense>
        <AnalyticsTracker />
      </Suspense>
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
