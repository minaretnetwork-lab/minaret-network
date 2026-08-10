export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, ChevronLeft, FileText, MapPin, SendHorizonal, Tag } from "lucide-react";
import { getConversationById, sendConversationMessage } from "@/lib/actions/messages";
import { Button } from "@/components/ui/button";
import { CategoryIcon } from "@/components/ui/category-icon";
import { Textarea } from "@/components/ui/textarea";
import { cn, formatDate } from "@/lib/utils";

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

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="space-y-3">
          {conversation.messages.length === 0 ? (
            <div className="rounded-xl bg-gray-50 p-5 text-center text-sm text-gray-500 dark:bg-gray-800/50 dark:text-gray-400">
              No messages yet. Send the first note below.
            </div>
          ) : (
            conversation.messages.map((message) => {
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
                      {displayName(message.sender)} ·{" "}
                      {new Date(message.createdAt).toLocaleString("en-CA", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <form action={sendConversationMessage.bind(null, conversation.id)} className="mt-5 space-y-3 border-t border-gray-100 pt-4 dark:border-gray-800">
          <Textarea
            name="body"
            minLength={1}
            maxLength={2000}
            required
            rows={4}
            placeholder="Write a reply..."
            className="min-h-28 resize-none bg-white dark:bg-gray-950"
          />
          <Button type="submit" className="w-full gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700 sm:w-auto">
            <SendHorizonal className="h-4 w-4" />
            Send message
          </Button>
        </form>
      </div>
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
