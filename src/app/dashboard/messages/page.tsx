export const dynamic = "force-dynamic";

import Link from "next/link";
import { ChevronRight, Inbox, MessageCircle } from "lucide-react";
import { getMyConversations } from "@/lib/actions/messages";
import { CategoryIcon } from "@/components/ui/category-icon";
import { formatDate } from "@/lib/utils";

function displayName(user: { displayName: string | null; firstName: string | null; lastName: string | null; email: string }) {
  return user.displayName || [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;
}

const REQUEST_STATUS_STYLES: Record<string, { label: string; className: string }> = {
  OPEN: { label: "Open", className: "border-green-200 bg-green-100 text-green-700" },
  IN_PROGRESS: { label: "In progress", className: "border-blue-200 bg-blue-100 text-blue-700" },
  CLOSED: { label: "Closed", className: "border-gray-200 bg-gray-100 text-gray-600" },
  CANCELLED: { label: "Cancelled", className: "border-red-200 bg-red-100 text-red-700" },
};

export default async function MessagesPage() {
  const { currentUserId, conversations } = await getMyConversations();

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-gray-900 dark:text-white">Messages</h1>
        <p className="mt-1 text-gray-500 dark:text-gray-400">
          Keep track of conversations connected to service requests.
        </p>
      </div>

      {conversations.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-900">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20">
            <Inbox className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">No messages yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-gray-500 dark:text-gray-400">
            Conversations will appear here when a professional responds to your service request, or when you message a
            requester from an incoming request.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {conversations.map((conversation) => {
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

            return (
              <Link
                key={conversation.id}
                href={`/dashboard/messages/${conversation.id}`}
                className="block rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-emerald-200 hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
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
                    <p className="mt-2 text-xs text-gray-400">Updated {formatDate(conversation.updatedAt)}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
