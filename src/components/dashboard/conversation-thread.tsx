"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { SendHorizonal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MESSAGE_NOTIFICATIONS_CHANGED_EVENT } from "@/lib/message-events";
import { cn } from "@/lib/utils";

type ConversationMessage = {
  id: string;
  senderId: string;
  senderName: string;
  body: string;
  createdAt: string;
};

type MessagesPayload = {
  currentUserId: string;
  messages: ConversationMessage[];
};

function formatMessageTime(value: string) {
  return new Date(value).toLocaleString("en-CA", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ConversationThread({
  conversationId,
  currentUserId,
  initialMessages,
  initialContextMessage,
  disabledReason,
}: {
  conversationId: string;
  currentUserId: string;
  initialMessages: ConversationMessage[];
  initialContextMessage?: ConversationMessage;
  disabledReason?: string;
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);
  const displayMessages = useMemo(
    () => initialContextMessage ? [initialContextMessage, ...messages] : messages,
    [initialContextMessage, messages]
  );
  const latestMessageId = displayMessages.at(-1)?.id;

  const endpoint = useMemo(
    () => `/api/dashboard/messages/${encodeURIComponent(conversationId)}`,
    [conversationId]
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [latestMessageId]);

  useEffect(() => {
    window.dispatchEvent(new Event(MESSAGE_NOTIFICATIONS_CHANGED_EVENT));
  }, [conversationId]);

  useEffect(() => {
    let cancelled = false;

    async function refreshMessages() {
      try {
        const response = await fetch(endpoint, { cache: "no-store" });
        if (!response.ok) return;

        const payload = await response.json() as MessagesPayload;
        if (!cancelled) {
          setMessages(payload.messages);
          window.dispatchEvent(new Event(MESSAGE_NOTIFICATIONS_CHANGED_EVENT));
        }
      } catch {
        // Keep the current thread visible if the network blips.
      }
    }

    const interval = window.setInterval(refreshMessages, 2000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [endpoint]);

  function sendMessage() {
    if (disabledReason) return;
    const trimmedBody = body.trim();
    if (!trimmedBody) return;

    setError(null);
    startTransition(async () => {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: trimmedBody }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null) as { error?: string } | null;
        setError(payload?.error ?? "Could not send that message. Please try again.");
        return;
      }

      const payload = await response.json() as { message: ConversationMessage };
      setMessages((current) => [...current.filter((message) => message.id !== payload.message.id), payload.message]);
      setBody("");
    });
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    sendMessage();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;

    event.preventDefault();
    if (!isPending) sendMessage();
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1 sm:max-h-[34rem]">
        {displayMessages.length === 0 ? (
          <div className="rounded-xl bg-gray-50 p-5 text-center text-sm text-gray-500 dark:bg-gray-800/50 dark:text-gray-400">
            No messages yet. Send the first note below.
          </div>
        ) : (
          displayMessages.map((message) => {
            const mine = message.senderId === currentUserId;
            return (
              <div key={message.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm",
                    mine
                      ? "rounded-br-sm bg-emerald-600 text-white"
                      : "rounded-bl-sm bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100"
                  )}
                >
                  <p className="whitespace-pre-line">{message.body}</p>
                  <p className={cn("mt-2 text-[11px]", mine ? "text-white/70" : "text-gray-400")}>
                    {message.senderName} · {formatMessageTime(message.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {disabledReason ? (
        <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-300">
          {disabledReason}
        </div>
      ) : (
      <form onSubmit={handleSubmit} className="mt-5 space-y-3 border-t border-gray-100 pt-4 dark:border-gray-800">
        <Textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={2000}
          required
          rows={4}
          placeholder="Write a reply..."
          className="min-h-28 resize-none bg-white dark:bg-gray-950"
        />
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <p className="hidden text-xs text-gray-400 sm:block">Press Enter to send. Use Shift+Enter for a new line.</p>
        <Button
          type="submit"
          disabled={isPending || body.trim().length === 0}
          className="w-full gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700 sm:w-auto"
        >
          <SendHorizonal className="h-4 w-4" />
          {isPending ? "Sending..." : "Send message"}
        </Button>
      </form>
      )}
    </div>
  );
}
