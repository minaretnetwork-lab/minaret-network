"use client";

import Link from "next/link";
import { LayoutDashboard, User, FileText, Sparkles, Star, Shield, LogOut, ChevronDown, Send, MessageCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface Props {
  displayName: string;
  isAdmin: boolean;
  isProfessional: boolean;
  unreadMessageCount?: number;
  latestUnreadConversationId?: string | null;
}

export function UserDropdown({
  displayName,
  isAdmin,
  isProfessional,
  unreadMessageCount = 0,
  latestUnreadConversationId,
}: Props) {
  const [open, setOpen] = useState(false);
  const [messageNotification, setMessageNotification] = useState({
    count: unreadMessageCount,
    latestConversationId: latestUnreadConversationId,
  });
  const ref = useRef<HTMLDivElement>(null);
  const messageHref = messageNotification.latestConversationId
    ? `/dashboard/messages/${messageNotification.latestConversationId}`
    : "/dashboard/messages";

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
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

    const interval = window.setInterval(refreshUnreadMessages, 10000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  const links = [
    { href: "/dashboard", label: "My Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
    { href: "/dashboard/profile", label: "My Profile", icon: <User className="h-4 w-4" /> },
    { href: "/dashboard/requests", label: "My Requests", icon: <FileText className="h-4 w-4" /> },
    {
      href: messageHref,
      label: "Messages",
      icon: <MessageCircle className="h-4 w-4" />,
      badge: messageNotification.count,
    },
    ...(isProfessional ? [
      { href: "/dashboard/leads", label: "Incoming Requests", icon: <Send className="h-4 w-4" /> },
      { href: "/dashboard/promote", label: "Sponsored Listing", icon: <Sparkles className="h-4 w-4" /> },
      { href: "/dashboard/featured", label: "Featured Business", icon: <Star className="h-4 w-4" /> },
    ] : []),
    ...(isAdmin ? [
      { href: "/admin", label: "Admin Panel", icon: <Shield className="h-4 w-4" /> },
    ] : []),
  ];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-white/80 hover:bg-white/10 transition-colors"
      >
        <div className="relative flex-shrink-0">
          <div className="h-7 w-7 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-bold">
            {(displayName?.[0] ?? "U").toUpperCase()}
          </div>
          {messageNotification.count > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-[#14532d]">
              {messageNotification.count > 9 ? "9+" : messageNotification.count}
            </span>
          )}
        </div>
        <span className="max-w-[120px] truncate">{displayName}</span>
        <ChevronDown className={`h-3.5 w-3.5 text-white/40 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-52 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl overflow-hidden z-50">
          {/* User info */}
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{displayName}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Minaret Network</p>
          </div>

          {/* Links */}
          <div className="py-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <span className="text-gray-400">{link.icon}</span>
                <span className="flex-1">{link.label}</span>
                {typeof link.badge === "number" && link.badge > 0 && (
                  <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                    {link.badge > 9 ? "9+" : link.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>

          {/* Sign out */}
          <div className="border-t border-gray-100 dark:border-gray-800 py-1">
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
