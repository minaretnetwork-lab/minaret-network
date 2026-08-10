export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, ChevronLeft, FileText, MapPin, Tag } from "lucide-react";
import { getConversationById } from "@/lib/actions/messages";
import { CategoryIcon } from "@/components/ui/category-icon";
import { ConversationThread } from "@/components/dashboard/conversation-thread";
import { formatDate } from "@/lib/utils";

interface Props {
  params: Promise<{ id: string }>;
}

function displayName(user: { displayName: string | null; firstName: string | null; lastName: string | null; email?: string }) {
  return user.displayName || [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || "User";
}

export default async function ConversationPage({ params }: Props) {
  const { id } = await params;
  const data = await getConversationById(id);
  if (!data) notFound();

  const { currentUserId, conversation } = data;
  const isRequester = conversation.requesterId === currentUserId;
  const otherPerson = isRequester
    ? displayName(conversation.professional.user)
    : displayName(conversation.requester);
  const requestLink = isRequester
    ? `/dashboard/requests/${conversation.serviceRequestId}`
    : `/dashboard/leads/${conversation.serviceRequestId}`;

  return (
    <div className="max-w-3xl space-y-6">
      <Link
        href="/dashboard/messages"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-[#14532d]"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to messages
      </Link>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20">
            <CategoryIcon slug={conversation.serviceRequest.category.slug} className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Conversation with {otherPerson}</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              About {conversation.serviceRequest.category.name}
              {conversation.serviceRequest.serviceArea ? ` in ${conversation.serviceRequest.serviceArea.name}` : ""}
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 border-t border-gray-100 pt-5 text-sm dark:border-gray-800 sm:grid-cols-3">
          <Detail icon={<Tag className="h-4 w-4" />} label="Category">
            {conversation.serviceRequest.category.name}
          </Detail>
          {conversation.serviceRequest.serviceArea && (
            <Detail icon={<MapPin className="h-4 w-4" />} label="Location">
              {conversation.serviceRequest.serviceArea.name}
            </Detail>
          )}
          {conversation.serviceRequest.preferredDate && (
            <Detail icon={<CalendarDays className="h-4 w-4" />} label="Wanted by">
              {formatDate(conversation.serviceRequest.preferredDate)}
            </Detail>
          )}
        </div>

        <Link
          href={requestLink}
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 hover:text-emerald-800"
        >
          <FileText className="h-4 w-4" />
          View service request details
        </Link>
      </div>

      <ConversationThread
        conversationId={conversation.id}
        currentUserId={currentUserId}
        initialMessages={conversation.messages.map((message) => ({
          id: message.id,
          senderId: message.senderId,
          senderName: displayName(message.sender),
          body: message.body,
          createdAt: message.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}

function Detail({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 flex-shrink-0 text-gray-400">{icon}</span>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</p>
        <div className="mt-0.5 font-medium text-gray-800 dark:text-gray-200">{children}</div>
      </div>
    </div>
  );
}
