"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MESSAGE_NOTIFICATIONS_CHANGED_EVENT } from "@/lib/message-events";

interface Props {
  displayName: string;
  unreadMessageCount?: number;
  latestUnreadConversationId?: string | null;
}

export function MobileProfileShortcut({
  displayName,
  unreadMessageCount = 0,
  latestUnreadConversationId,
}: Props) {
  const [messageNotification, setMessageNotification] = useState({
    count: unreadMessageCount,
    latestConversationId: latestUnreadConversationId,
  });
  const href = messageNotification.latestConversationId
    ? `/dashboard/messages/${messageNotification.latestConversationId}`
    : "/dashboard";

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
    <Link
      href={href}
      aria-label={
        messageNotification.count > 0
          ? `${messageNotification.count} unread messages`
          : "Open dashboard"
      }
      className="relative flex h-10 w-10 items-center justify-center rounded-lg text-white/80 hover:bg-white/10 hover:text-white"
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
        {(displayName?.[0] ?? "U").toUpperCase()}
      </span>
      {messageNotification.count > 0 && (
        <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-[#14532d]">
          {messageNotification.count > 9 ? "9+" : messageNotification.count}
        </span>
      )}
    </Link>
  );
}
