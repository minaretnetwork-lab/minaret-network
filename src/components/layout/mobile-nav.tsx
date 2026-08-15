"use client";

import Link from "next/link";
import { LogOut, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { MESSAGE_NOTIFICATIONS_CHANGED_EVENT } from "@/lib/message-events";
import { getAccountNavigation, getExploreNavigation } from "@/components/layout/account-navigation";

interface MobileNavProps {
  isAdmin: boolean;
  isProfessional?: boolean;
  user?: {
    displayName?: string | null;
    firstName?: string | null;
    email: string;
    unreadMessageCount?: number;
    latestUnreadConversationId?: string | null;
  } | null;
}

type NotificationPayload = {
  count: number;
  totalCount?: number;
  messagesCount?: number;
  adminCount?: number;
  latestConversationId: string | null;
};

export function MobileNav({ isAdmin, isProfessional = false, user }: MobileNavProps) {
  const displayName = user?.displayName ?? user?.firstName ?? user?.email;
  const [open, setOpen] = useState(false);
  const [messageNotification, setMessageNotification] = useState({
    count: user?.unreadMessageCount ?? 0,
    totalCount: user?.unreadMessageCount ?? 0,
    messagesCount: user?.unreadMessageCount ?? 0,
    adminCount: 0,
    latestConversationId: user?.latestUnreadConversationId ?? null,
  });
  const messageHref = messageNotification.latestConversationId
    ? `/dashboard/messages/${messageNotification.latestConversationId}`
    : "/dashboard/messages";
  const exploreGroups = getExploreNavigation();
  const accountGroups = getAccountNavigation({
    isAdmin,
    isProfessional,
    messageHref,
    messageBadge: messageNotification.messagesCount,
    adminBadge: messageNotification.adminCount,
  });

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    async function refreshUnreadMessages() {
      try {
        const response = await fetch("/api/dashboard/messages/unread", { cache: "no-store" });
        if (!response.ok) return;

        const payload = await response.json() as NotificationPayload;
        if (!cancelled) {
          setMessageNotification({
            count: payload.messagesCount ?? payload.count,
            totalCount: payload.totalCount ?? payload.count,
            messagesCount: payload.messagesCount ?? payload.count,
            adminCount: payload.adminCount ?? 0,
            latestConversationId: payload.latestConversationId,
          });
        }
      } catch {
        // Keep the last known badge state if the network blips.
      }
    }

    refreshUnreadMessages();
    window.addEventListener(MESSAGE_NOTIFICATIONS_CHANGED_EVENT, refreshUnreadMessages);
    const interval = window.setInterval(refreshUnreadMessages, 10000);
    return () => {
      cancelled = true;
      window.removeEventListener(MESSAGE_NOTIFICATIONS_CHANGED_EVENT, refreshUnreadMessages);
      window.clearInterval(interval);
    };
  }, [user]);

  function closeMenu() {
    setOpen(false);
  }

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex h-10 w-10 items-center justify-center rounded-lg text-white/80 transition-colors hover:bg-white/10 hover:text-white"
        style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent" }}
      >
        {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {open && (
      <div className="fixed inset-x-0 top-16 z-[90] bg-[#14532d] border-b border-white/10 shadow-lg">
        <div className="container mx-auto px-4 py-5 flex flex-col gap-1">
          {exploreGroups.map((group) => (
            <div key={group.id} className="flex flex-col gap-1">
              <p className="px-3 pt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">
                {group.label}
              </p>
              {group.items.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={closeMenu}
                  className="py-3 px-3 rounded-lg text-base font-medium text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          ))}

          <div className="mt-3 pt-4 border-t border-white/10 flex flex-col gap-1">
            {user ? (
              <>
                <div className="flex items-center gap-2 px-3 py-2 mb-1">
                  <div className="relative flex-shrink-0">
                    <div className="h-7 w-7 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-bold">
                      {(displayName?.[0] ?? "U").toUpperCase()}
                    </div>
                    {messageNotification.totalCount > 0 && (
                      <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-[#14532d]">
                        {messageNotification.totalCount > 9 ? "9+" : messageNotification.totalCount}
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-medium text-white truncate">{displayName}</span>
                </div>
                {accountGroups.map((group) => (
                  <div key={group.id} className="flex flex-col gap-1">
                    <p className="px-3 pt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">
                      {group.label}
                    </p>
                    {group.items.map((link) => (
                      <Link key={link.href} href={link.href}
                        onClick={closeMenu}
                        className="flex items-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-colors">
                        <span className="flex-1">{link.label}</span>
                        {typeof link.badge === "number" && link.badge > 0 && (
                          <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                            {link.badge > 9 ? "9+" : link.badge}
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                ))}
                <form action="/auth/signout" method="post" className="mt-2">
                  <button
                    type="submit"
                    className="inline-flex h-7 w-full items-center justify-center gap-1 rounded-[min(var(--radius-md),12px)] border border-white/20 bg-white/10 px-2.5 text-[0.8rem] font-medium text-white transition-all hover:bg-white/20"
                  >
                    <LogOut className="h-3.5 w-3.5" /> Sign out
                  </button>
                </form>
              </>
            ) : (
              <div className="mt-2 flex flex-col gap-3">
                <Link href="/auth/login" onClick={closeMenu}>
                  <Button
                    size="sm"
                    className="w-full border border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                  >
                    Sign in
                  </Button>
                </Link>
                <Link href="/professionals/register" onClick={closeMenu}>
                  <Button size="sm" className="w-full bg-white text-[#14532d] hover:bg-white/90 hover:text-[#14532d] font-medium">
                    Join as Professional
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
