"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface PendingChatRedirectProps {
  professionalId: string;
}

export function PendingChatRedirect({ professionalId }: PendingChatRedirectProps) {
  const router = useRouter();
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    async function completePendingChat() {
      const pendingRaw = window.sessionStorage.getItem("minaret_ai_pending_chat");
      if (!pendingRaw) return;

      try {
        const pending = JSON.parse(pendingRaw) as {
          professionalId?: string;
          issue?: string;
          location?: string;
        };
        if (pending.professionalId !== professionalId || !pending.issue) return;

        const response = await fetch("/api/ai/start-chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(pending),
        });
        const payload = await response.json();
        if (!response.ok || typeof payload.chatUrl !== "string") {
          window.sessionStorage.removeItem("minaret_ai_pending_chat");
          return;
        }

        window.sessionStorage.removeItem("minaret_ai_pending_chat");
        router.replace(payload.chatUrl);
        router.refresh();
      } catch {
        window.sessionStorage.removeItem("minaret_ai_pending_chat");
      }
    }

    completePendingChat();
  }, [professionalId, router]);

  return null;
}
