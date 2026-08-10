export const dynamic = "force-dynamic";

import Link from "next/link";
import { CalendarDays, FileText, Inbox, Mail, MapPin, MessageCircle, Phone, Tag } from "lucide-react";
import { getConversationById, getMyConversations } from "@/lib/actions/messages";
import { Button } from "@/components/ui/button";
import { CategoryIcon } from "@/components/ui/category-icon";
import { ConversationThread } from "@/components/dashboard/conversation-thread";
import { buildWhatsAppUrl, cn, formatDate } from "@/lib/utils";

function displayName(user: { displayName: string | null; firstName: string | null; lastName: string | null; email?: string }) {
  return user.displayName || [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || "User";
}

function firstName(user: { displayName: string | null; firstName: string | null; lastName: string | null; email?: string }) {
  return user.firstName || user.displayName?.split(" ")[0] || user.email?.split("@")[0] || "them";
}

interface Props {
  searchParams?: Promise<{ conversation?: string }>;
}

type ConversationForPane = NonNullable<Awaited<ReturnType<typeof getConversationById>>>["conversation"];

export default async function MessagesPage({ searchParams }: Props) {
  const { currentUserId, conversations } = await getMyConversations();
  const selectedConversationId = (await searchParams)?.conversation ?? conversations[0]?.id ?? null;
  const selectedData = selectedConversationId ? await getConversationById(selectedConversationId) : null;
  const selectedConversation = selectedData?.conversation ?? null;

  return (
    <div className="space-y-6">
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
        <div className="grid min-h-[38rem] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 lg:grid-cols-[22rem_1fr]">
          <aside className="border-b border-gray-200 dark:border-gray-800 lg:border-b-0 lg:border-r">
            <div className="border-b border-gray-100 p-4 dark:border-gray-800">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Conversations</p>
              <p className="text-xs text-gray-400">
                {conversations.length} active thread{conversations.length === 1 ? "" : "s"}
              </p>
            </div>

            <div className="max-h-[32rem] overflow-y-auto">
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
                const selected = selectedConversationId === conversation.id;

                return (
                  <Link
                    key={conversation.id}
                    href={`/dashboard/messages?conversation=${conversation.id}`}
                    className={cn(
                      "block border-b border-gray-100 p-4 transition dark:border-gray-800",
                      selected
                        ? "bg-emerald-50 dark:bg-emerald-900/20"
                        : "hover:bg-gray-50 dark:hover:bg-gray-950"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20">
                        <CategoryIcon slug={conversation.serviceRequest.category.slug} className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="truncate font-semibold text-gray-900 dark:text-white">{title}</p>
                          <span className="mt-0.5 flex-shrink-0 text-[11px] text-gray-400">
                            {new Date(conversation.updatedAt).toLocaleDateString("en-CA", { month: "short", day: "numeric" })}
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-sm text-gray-500 dark:text-gray-400">
                          {context}
                          {conversation.serviceRequest.serviceArea ? ` · ${conversation.serviceRequest.serviceArea.name}` : ""}
                        </p>
                        <div className="mt-2 flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                          <MessageCircle className="h-3.5 w-3.5 flex-shrink-0" />
                          <span className="truncate">
                            {lastMessage ? lastMessage.body : "No messages yet — send the first reply."}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </aside>

          <section className="min-w-0 bg-gray-50 dark:bg-gray-950">
            {selectedConversation && selectedData ? (
              <MessagePane currentUserId={selectedData.currentUserId} conversation={selectedConversation} />
            ) : (
              <div className="flex h-full min-h-[30rem] items-center justify-center p-8 text-center">
                <div>
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                    <MessageCircle className="h-6 w-6" />
                  </div>
                  <p className="font-semibold text-gray-900 dark:text-white">Choose a conversation</p>
                  <p className="mt-1 text-sm text-gray-500">Select someone on the left to open the chat.</p>
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function MessagePane({ currentUserId, conversation }: { currentUserId: string; conversation: ConversationForPane }) {
  const isRequester = conversation.requesterId === currentUserId;
  const otherPerson = isRequester
    ? displayName(conversation.professional.user)
    : displayName(conversation.requester);
  const professionalDisplayName = displayName(conversation.professional.user);
  const conversationTitle = isRequester
    ? conversation.professional.businessName || professionalDisplayName
    : otherPerson;
  const contactTitle = isRequester
    ? `Contact ${firstName(conversation.professional.user)}${
        conversation.professional.businessName ? ` at ${conversation.professional.businessName}` : ""
      }`
    : `Contact ${firstName(conversation.requester)}`;
  const requestLink = isRequester
    ? `/dashboard/requests/${conversation.serviceRequestId}`
    : `/dashboard/leads/${conversation.serviceRequestId}`;
  const targetName = isRequester
    ? conversation.professional.businessName || otherPerson
    : otherPerson;
  const whatsappPhone = isRequester
    ? conversation.professional.whatsapp || conversation.professional.phone
    : conversation.serviceRequest.contactPhone;
  const email = isRequester
    ? conversation.professional.email || conversation.professional.user.email
    : conversation.serviceRequest.contactEmail || conversation.requester.email;
  const callPhone = isRequester
    ? conversation.professional.phone || conversation.professional.whatsapp
    : conversation.serviceRequest.contactPhone;
  const whatsappHref = whatsappPhone
    ? buildWhatsAppUrl(
        whatsappPhone,
        `Hi ${targetName}, I'm following up on our ${conversation.serviceRequest.category.name} conversation from Minaret Network.`
      )
    : null;

  return (
    <div className="flex h-full min-h-[38rem] flex-col">
      <div className="border-b border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20">
            <CategoryIcon slug={conversation.serviceRequest.category.slug} className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-bold text-gray-900 dark:text-white">{conversationTitle}</h2>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
              {isRequester && conversation.professional.businessName ? `${professionalDisplayName} · ` : ""}
              {conversation.serviceRequest.category.name}
              {conversation.serviceRequest.serviceArea ? ` in ${conversation.serviceRequest.serviceArea.name}` : ""}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-gray-500">
          <span className="inline-flex items-center gap-1">
            <Tag className="h-3.5 w-3.5" />
            {conversation.serviceRequest.category.name}
          </span>
          {conversation.serviceRequest.serviceArea && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {conversation.serviceRequest.serviceArea.name}
            </span>
          )}
          {conversation.serviceRequest.preferredDate && (
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" />
              {formatDate(conversation.serviceRequest.preferredDate)}
            </span>
          )}
          <Link href={requestLink} className="inline-flex items-center gap-1 font-medium text-emerald-700 hover:text-emerald-800">
            <FileText className="h-3.5 w-3.5" />
            Request details
          </Link>
        </div>
      </div>

      <div className="min-h-0 flex-1 p-4">
        <ConversationThread
          conversationId={conversation.id}
          currentUserId={currentUserId}
          initialContextMessage={{
            id: `request-${conversation.serviceRequestId}`,
            senderId: conversation.requesterId,
            senderName: displayName(conversation.requester),
            body: conversation.serviceRequest.description,
            createdAt: conversation.serviceRequest.createdAt.toISOString(),
          }}
          initialMessages={conversation.messages.map((message) => ({
            id: message.id,
            senderId: message.senderId,
            senderName: displayName(message.sender),
            body: message.body,
            createdAt: message.createdAt.toISOString(),
          }))}
        />
      </div>

      {(whatsappHref || email || callPhone) && (
        <div className="border-t border-emerald-100 bg-emerald-50 p-4 dark:border-emerald-800/40 dark:bg-emerald-900/20">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="font-semibold text-emerald-950 dark:text-emerald-100">{contactTitle}</h3>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              {whatsappHref && (
                <a href={whatsappHref} target="_blank" rel="noreferrer" className="w-full sm:w-auto">
                  <Button className="w-full gap-1.5 bg-green-600 text-white hover:bg-green-700 sm:w-auto">
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp
                  </Button>
                </a>
              )}
              {email && (
                <a href={`mailto:${email}`} className="w-full sm:w-auto">
                  <Button variant="outline" className="w-full gap-1.5 border-emerald-300 bg-white text-emerald-700 hover:bg-emerald-50 sm:w-auto">
                    <Mail className="h-4 w-4" />
                    Email
                  </Button>
                </a>
              )}
              {callPhone && (
                <a href={`tel:${callPhone}`} className="w-full sm:w-auto">
                  <Button variant="outline" className="w-full gap-1.5 border-emerald-300 bg-white text-emerald-700 hover:bg-emerald-50 sm:w-auto">
                    <Phone className="h-4 w-4" />
                    Call
                  </Button>
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
