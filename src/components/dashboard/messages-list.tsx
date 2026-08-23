"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { Archive, ArchiveRestore, ChevronRight, Inbox, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { CategoryIcon } from "@/components/ui/category-icon";
import { formatDate } from "@/lib/utils";
import { setConversationArchivedState } from "@/lib/actions/messages";
import { ArchiveContextMenu } from "@/components/dashboard/archive-context-menu";

type ConversationItem = {
  id: string;
  requesterId: string;
  requester: {
    displayName: string | null;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
  professional: {
    businessName: string | null;
    user: {
      id: string;
      displayName: string | null;
      firstName: string | null;
      lastName: string | null;
      email: string;
    } | null;
  };
  serviceRequest: {
    status: string;
    category: { name: string; slug: string };
    serviceArea: { name: string } | null;
  };
  messages: Array<{ body: string }>;
  updatedAt: Date;
};

const REQUEST_STATUS_STYLES: Record<string, { label: string; className: string }> = {
  OPEN: { label: "Open", className: "border-green-200 bg-green-100 text-green-700" },
  IN_PROGRESS: { label: "In progress", className: "border-blue-200 bg-blue-100 text-blue-700" },
  CLOSED: { label: "Closed", className: "border-gray-200 bg-gray-100 text-gray-600" },
  CANCELLED: { label: "Cancelled", className: "border-red-200 bg-red-100 text-red-700" },
};

function displayName(user: { displayName: string | null; firstName: string | null; lastName: string | null; email: string } | null) {
  if (!user) return "Business";
  return user.displayName || [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;
}

function isClosedStatus(status: string) {
  return status === "CLOSED" || status === "CANCELLED";
}

export function MessagesList({
  currentUserId,
  conversations,
  view,
}: {
  currentUserId: string | null;
  conversations: ConversationItem[];
  view: "active" | "archived";
}) {
  const [openSwipeId, setOpenSwipeId] = useState<string | null>(null);
  const [dragState, setDragState] = useState<{ id: string; startX: number; deltaX: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const { openConversations, closedConversations, archivedConversations } = useMemo(() => {
    const sorted = [...conversations].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );

    if (view === "archived") {
      return {
        openConversations: [] as ConversationItem[],
        closedConversations: [] as ConversationItem[],
        archivedConversations: sorted,
      };
    }

    return {
      openConversations: sorted.filter((conversation) => !isClosedStatus(conversation.serviceRequest.status)),
      closedConversations: sorted.filter((conversation) => isClosedStatus(conversation.serviceRequest.status)),
      archivedConversations: [] as ConversationItem[],
    };
  }, [conversations, view]);

  function beginSwipe(id: string, clientX: number, enabled: boolean) {
    if (!enabled) return;
    setDragState({ id, startX: clientX, deltaX: 0 });
  }

  function updateSwipe(clientX: number) {
    setDragState((current) => {
      if (!current) return null;
      const deltaX = Math.min(0, clientX - current.startX);
      return { ...current, deltaX };
    });
  }

  function endSwipe() {
    if (!dragState) return;
    setOpenSwipeId(dragState.deltaX <= -72 ? dragState.id : null);
    setDragState(null);
  }

  function updateArchivedState(conversationId: string, archived: boolean) {
    setError(null);
    startTransition(async () => {
      try {
        await setConversationArchivedState(conversationId, archived);
        setOpenSwipeId((current) => (current === conversationId ? null : current));
        if (archived) {
          toast.success("Conversation archived", {
            duration: 6000,
            action: {
              label: "Undo",
              onClick: () => updateArchivedState(conversationId, false),
            },
          });
        } else {
          toast.success("Conversation restored");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not update this conversation right now.");
        toast.error(err instanceof Error ? err.message : "Could not update this conversation right now.");
      }
    });
  }

  function renderConversation(conversation: ConversationItem, options?: { swipeToArchive?: boolean; archivedView?: boolean }) {
    const isRequester = conversation.requesterId === currentUserId;
    const professionalName = displayName(conversation.professional.user);
    const title = isRequester
      ? conversation.professional.businessName || professionalName
      : displayName(conversation.requester);
    const context = isRequester && conversation.professional.businessName
      ? `${professionalName} · ${conversation.serviceRequest.category.name}`
      : conversation.serviceRequest.category.name;
    const lastMessage = conversation.messages[0];
    const statusUi = REQUEST_STATUS_STYLES[conversation.serviceRequest.status] ?? REQUEST_STATUS_STYLES.OPEN;
    const isOpen = openSwipeId === conversation.id;
    const isDragging = dragState?.id === conversation.id;
    const dragOffset = isDragging ? Math.max(-96, dragState.deltaX) : isOpen ? -88 : 0;

    return (
      <ArchiveContextMenu
        key={conversation.id}
        archived={Boolean(options?.archivedView)}
        enabled={Boolean(options?.swipeToArchive || options?.archivedView)}
        disabled={isPending}
        onSelect={() => updateArchivedState(conversation.id, !options?.archivedView)}
      >
      <div className="space-y-1">
        <div className="relative overflow-hidden rounded-2xl">
          {options?.swipeToArchive && (
            <div className="absolute inset-y-0 right-0 flex w-24 items-center justify-center rounded-2xl bg-gray-900 text-white">
              <button
                type="button"
                onClick={() => updateArchivedState(conversation.id, true)}
                disabled={isPending}
                className="flex h-full w-full flex-col items-center justify-center gap-1 text-xs font-medium"
              >
                <Archive className="h-4 w-4" />
                {isPending ? "Saving..." : "Archive"}
              </button>
            </div>
          )}

          <Link
            href={`/dashboard/messages/${conversation.id}`}
            className="block rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-emerald-200 hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
            style={{ transform: `translateX(${dragOffset}px)` }}
            onTouchStart={(event) => beginSwipe(conversation.id, event.touches[0].clientX, Boolean(options?.swipeToArchive))}
            onTouchMove={(event) => updateSwipe(event.touches[0].clientX)}
            onTouchEnd={endSwipe}
            onMouseDown={(event) => {
              if (window.innerWidth >= 768) return;
              beginSwipe(conversation.id, event.clientX, Boolean(options?.swipeToArchive));
            }}
            onMouseMove={(event) => {
              if (!dragState) return;
              updateSwipe(event.clientX);
            }}
            onMouseUp={endSwipe}
            onMouseLeave={endSwipe}
          >
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20">
                <CategoryIcon slug={conversation.serviceRequest.category.slug} className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{title}</p>
                    <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                      {context}
                      {conversation.serviceRequest.serviceArea ? ` · ${conversation.serviceRequest.serviceArea.name}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-2">
                    <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${statusUi.className}`}>
                      {statusUi.label}
                    </span>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <MessageCircle className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">
                    {lastMessage ? lastMessage.body : "No messages yet — open the thread to send the first reply."}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <p className="text-xs text-gray-400">Updated {formatDate(conversation.updatedAt)}</p>
                  {options?.archivedView ? (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        updateArchivedState(conversation.id, false);
                      }}
                      disabled={isPending}
                      className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-2.5 py-1 text-[11px] font-medium text-gray-600 transition hover:border-gray-300 hover:text-gray-900"
                    >
                      <ArchiveRestore className="h-3.5 w-3.5" />
                      {isPending ? "Saving..." : "Restore"}
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </Link>
        </div>
        {options?.swipeToArchive && !isOpen && (
          <p className="px-1 text-[11px] text-gray-400 md:hidden">Swipe left to archive</p>
        )}
      </div>
      </ArchiveContextMenu>
    );
  }

  if (view === "archived") {
    if (archivedConversations.length === 0) {
      return (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-900">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20">
            <Inbox className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">No archived conversations yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-gray-500 dark:text-gray-400">
            When you archive a closed conversation, it will stay available here for later review.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Archived</h2>
        </div>
        {archivedConversations.map((conversation) => renderConversation(conversation, { archivedView: true }))}
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      </div>
    );
  }

  if (openConversations.length === 0 && closedConversations.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-900">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20">
          <Inbox className="h-6 w-6" />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">No messages yet</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-gray-500 dark:text-gray-400">
          Conversations will appear here when a professional responds to your service request, or when you message a requester from an incoming request.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {openConversations.length > 0 && (
        <section className="space-y-3">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Open</h2>
          </div>
          {openConversations.map((conversation) => renderConversation(conversation))}
        </section>
      )}

      {closedConversations.length > 0 && (
        <section className="space-y-3">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Closed</h2>
            <p className="mt-1 text-xs text-gray-400">Swipe left on mobile to archive closed conversations.</p>
          </div>
          {closedConversations.map((conversation) => renderConversation(conversation, { swipeToArchive: true }))}
        </section>
      )}

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
