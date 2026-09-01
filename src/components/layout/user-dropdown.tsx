"use client";

import Link from "next/link";
import { LogOut, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { MESSAGE_NOTIFICATIONS_CHANGED_EVENT } from "@/lib/message-events";
import { getAccountNavigation } from "@/components/layout/account-navigation";

interface Props {
  displayName: string;
  isAdmin: boolean;
  isProfessional: boolean;
  unreadMessageCount?: number;
  adminNotificationCount?: number;
  totalNotificationCount?: number;
  latestUnreadConversationId?: string | null;
  compact?: boolean;
}

type NotificationPayload = {
  count: number;
  totalCount?: number;
  messagesCount?: number;
  adminCount?: number;
  latestConversationId: string | null;
};

export function UserDropdown({
  displayName,
  isAdmin,
  isProfessional,
  unreadMessageCount = 0,
  adminNotificationCount = 0,
  totalNotificationCount,
  latestUnreadConversationId,
  compact = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [messageNotification, setMessageNotification] = useState({
    count: unreadMessageCount,
    totalCount: totalNotificationCount ?? unreadMessageCount + adminNotificationCount,
    messagesCount: unreadMessageCount,
    adminCount: adminNotificationCount,
    latestConversationId: latestUnreadConversationId,
  });
  const ref = useRef<HTMLDivElement>(null);
  const messageHref = messageNotification.latestConversationId
    ? `/dashboard/messages/${messageNotification.latestConversationId}`
    : "/dashboard/messages";
  const accountGroups = getAccountNavigation({
    isAdmin,
    isProfessional,
    messageHref,
    messageBadge: messageNotification.messagesCount,
    adminBadge: messageNotification.adminCount,
  });
  useEffect(() => {
    function handlePointerDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  useEffect(() => {
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
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 rounded-lg text-sm font-medium text-white/80 hover:bg-white/10 transition-colors ${
          compact ? "h-10 px-2" : "px-3 py-2"
        }`}
        aria-label={compact ? "Open profile menu" : undefined}
        aria-expanded={open}
        style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent" }}
      >
        <div className="relative flex-shrink-0">
          <div className="h-7 w-7 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-bold">
            {(displayName?.[0] ?? "U").toUpperCase()}
          </div>
          {messageNotification.totalCount > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-[#14532d]">
              {messageNotification.totalCount > 9 ? "9+" : messageNotification.totalCount}
            </span>
          )}
        </div>
        {!compact && (
          <>
            <span className="max-w-[120px] truncate">{displayName}</span>
            <ChevronDown className={`h-3.5 w-3.5 text-white/40 transition-transform ${open ? "rotate-180" : ""}`} />
          </>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-52 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl overflow-hidden z-[160]">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{displayName}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Minaret Network</p>
          </div>
          {accountGroups.map((group, index) => (
            <div key={group.id} className={`${index === 0 ? "py-1" : "border-t border-gray-100 py-1 dark:border-gray-800"}`}>
              <p className="px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400">
                {group.label}
              </p>
              {group.items.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <span className="text-gray-400"><Icon className="h-4 w-4" /></span>
                    <span className="flex-1">{link.label}</span>
                    {typeof link.badge === "number" && link.badge > 0 && (
                      <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                        {link.badge > 9 ? "9+" : link.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
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
