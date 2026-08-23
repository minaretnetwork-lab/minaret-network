export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, ChevronLeft, FileText, Mail, MapPin, MessageCircle, Phone, Tag } from "lucide-react";
import { getConversationById } from "@/lib/actions/messages";
import { Button } from "@/components/ui/button";
import { CategoryIcon } from "@/components/ui/category-icon";
import { ConversationThread } from "@/components/dashboard/conversation-thread";
import { ArchiveConversationButton } from "@/components/dashboard/archive-conversation-button";
import { ReopenRequestButton } from "@/components/dashboard/reopen-request-button";
import { buildWhatsAppUrl, formatDate } from "@/lib/utils";

interface Props {
  params: Promise<{ id: string }>;
}

function displayName(user: { displayName: string | null; firstName: string | null; lastName: string | null; email?: string } | null) {
  if (!user) return "Business";
  return user.displayName || [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || "User";
}

function firstName(user: { displayName: string | null; firstName: string | null; lastName: string | null; email?: string } | null) {
  if (!user) return "them";
  return user.firstName || user.displayName?.split(" ")[0] || user.email?.split("@")[0] || "them";
}

const REQUEST_STATUS_STYLES: Record<string, { label: string; className: string }> = {
  OPEN: { label: "Open", className: "border-green-200 bg-green-100 text-green-700" },
  IN_PROGRESS: { label: "In progress", className: "border-blue-200 bg-blue-100 text-blue-700" },
  CLOSED: { label: "Closed", className: "border-gray-200 bg-gray-100 text-gray-600" },
  CANCELLED: { label: "Cancelled", className: "border-red-200 bg-red-100 text-red-700" },
};

export default async function ConversationPage({ params }: Props) {
  const { id } = await params;
  const data = await getConversationById(id);
  if (!data) notFound();

  const { currentUserId, conversation, viewerHasArchived } = data;
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
    ? conversation.professional.email || conversation.professional.user?.email
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
  const requestClosed = conversation.serviceRequest.status === "CLOSED" || conversation.serviceRequest.status === "CANCELLED";
  const closedLabel = conversation.serviceRequest.status === "CANCELLED" ? "cancelled" : "closed";
  const statusUi = REQUEST_STATUS_STYLES[conversation.serviceRequest.status] ?? REQUEST_STATUS_STYLES.OPEN;
  const titleClassName = "text-xl font-bold text-gray-900 dark:text-white";

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
            <div className="flex flex-wrap items-center gap-2">
              {isRequester ? (
                <Link
                  href={`/professionals/${conversation.professional.id}`}
                  className={`${titleClassName} transition-colors hover:text-emerald-700`}
                >
                  {conversationTitle}
                </Link>
              ) : (
                <h1 className={titleClassName}>{conversationTitle}</h1>
              )}
              <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${statusUi.className}`}>
                {statusUi.label}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {isRequester && conversation.professional.businessName ? `${professionalDisplayName} · ` : ""}
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
        disabledReason={
          requestClosed
            ? `This request is ${closedLabel}. The requester needs to reopen it before more messages can be sent.`
            : undefined
        }
      />

      {requestClosed && (
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h2 className="font-semibold text-gray-900 dark:text-white">This request is {closedLabel}</h2>
          <p className="mt-1 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
            Messaging is paused while the related service request is {closedLabel}.
          </p>
          <div className="mt-4">
            <ArchiveConversationButton conversationId={conversation.id} archived={viewerHasArchived} />
          </div>
          {isRequester ? (
            <div className="mt-4">
              <ReopenRequestButton requestId={conversation.serviceRequestId} />
            </div>
          ) : (
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
              Ask the requester to reopen the ticket if more discussion is needed.
            </p>
          )}
        </div>
      )}

      {(whatsappHref || email || callPhone) && (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 shadow-sm dark:border-emerald-800/40 dark:bg-emerald-900/20">
          <h2 className="font-semibold text-emerald-950 dark:text-emerald-100">{contactTitle}</h2>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
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
      )}
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
