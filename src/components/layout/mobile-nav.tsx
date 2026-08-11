"use client";

import Link from "next/link";
import { LogOut, Shield, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { MESSAGE_NOTIFICATIONS_CHANGED_EVENT } from "@/lib/message-events";

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

export function MobileNav({ isAdmin, isProfessional = false, user }: MobileNavProps) {
  const displayName = user?.displayName ?? user?.firstName ?? user?.email;
  const [open, setOpen] = useState(false);
  const [messageNotification, setMessageNotification] = useState({
    count: user?.unreadMessageCount ?? 0,
    latestConversationId: user?.latestUnreadConversationId ?? null,
  });
  const messageHref = messageNotification.latestConversationId
    ? `/dashboard/messages/${messageNotification.latestConversationId}`
    : "/dashboard/messages";

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    async function refreshUnreadMessages() {
      try {
        const response = await fetch("/api/dashboard/messages/unread", { cache: "no-store" });
        if (!response.ok) return;

        const payload = await response.json() as { count: number; latestConversationId: string | null };
        if (!cancelled) setMessageNotification(payload);
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
          {[
            { href: "/professionals", label: "Find Professionals" },
            { href: "/categories", label: "Categories" },
            { href: "/request", label: "Service Request" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={closeMenu}
              className="py-3 px-3 rounded-lg text-base font-medium text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              {link.label}
            </Link>
          ))}

          {isAdmin && (
            <Link
              href="/admin"
              onClick={closeMenu}
              className="py-3 px-3 rounded-lg text-base font-medium text-white hover:bg-white/10 flex items-center gap-2 transition-colors"
            >
              <Shield className="h-4 w-4" /> Admin Panel
            </Link>
          )}

          <div className="mt-3 pt-4 border-t border-white/10 flex flex-col gap-1">
            {user ? (
              <>
                <div className="flex items-center gap-2 px-3 py-2 mb-1">
                  <div className="relative flex-shrink-0">
                    <div className="h-7 w-7 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-bold">
                      {(displayName?.[0] ?? "U").toUpperCase()}
                    </div>
                    {messageNotification.count > 0 && (
                      <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-[#14532d]">
                        {messageNotification.count > 9 ? "9+" : messageNotification.count}
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-medium text-white truncate">{displayName}</span>
                </div>
                {[
                  { href: "/dashboard", label: "My Dashboard" },
                  { href: "/dashboard/profile", label: "My Profile" },
                  { href: "/dashboard/requests", label: "My Requests" },
                  { href: messageHref, label: "Messages", badge: messageNotification.count },
                  ...(isProfessional ? [{ href: "/dashboard/leads", label: "Incoming Requests" }] : []),
                ].map((link) => (
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
                {isAdmin && (
                  <Link href="/admin"
                    onClick={closeMenu}
                    className="py-2.5 px-3 rounded-lg text-sm font-medium text-white hover:bg-white/10 transition-colors">
                    Admin Panel
                  </Link>
                )}
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
              <>
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
              </>
            )}
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
