import { notFound } from "next/navigation";
import Link from "next/link";
import {
  CalendarDays,
  ChevronLeft,
  Clock,
  FileText,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Tag,
  User,
} from "lucide-react";
import { getMatchingServiceRequestById } from "@/lib/actions/service-requests";
import { getConversationForMatchingServiceRequest } from "@/lib/actions/messages";
import { Button } from "@/components/ui/button";
import { ConversationThread } from "@/components/dashboard/conversation-thread";
import { CategoryIcon } from "@/components/ui/category-icon";
import { buildWhatsAppUrl, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

const CONTACT_LABEL: Record<string, string> = {
  EMAIL: "Email",
  PHONE: "Phone",
  WHATSAPP: "WhatsApp",
};

const CONTACT_ICON: Record<string, React.ReactNode> = {
  EMAIL: <Mail className="h-4 w-4" />,
  PHONE: <Phone className="h-4 w-4" />,
  WHATSAPP: <MessageCircle className="h-4 w-4" />,
};

function displayName(user: { displayName: string | null; firstName: string | null; lastName: string | null; email?: string }) {
  return user.displayName || [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || "User";
}

function firstName(user?: { displayName: string | null; firstName: string | null; lastName: string | null } | null) {
  if (!user) return "Professional";
  return user.firstName || user.displayName || [user.firstName, user.lastName].filter(Boolean).join(" ") || "Professional";
}

export default async function MatchingRequestDetailPage({ params }: Props) {
  const { id } = await params;
  const [request, conversationData] = await Promise.all([
    getMatchingServiceRequestById(id),
    getConversationForMatchingServiceRequest(id),
  ]);

  if (!request) notFound();

  const requesterName =
    request.contactName ??
    request.user.displayName ??
    [request.user.firstName, request.user.lastName].filter(Boolean).join(" ") ??
    "Requester";
  const professional = request.matchedProfessional;
  const professionalName = firstName(professional?.user);
  const businessName = professional?.businessName || professional?.title || request.category.name;
  const requestTitle = professional ? `${professionalName} at ${businessName}` : request.category.name;
  const whatsappHref = request.contactPhone
    ? buildWhatsAppUrl(
        request.contactPhone,
        `Hi ${requesterName}, I saw your ${request.category.name} request on Minaret Network and may be able to help.`
      )
    : null;

  return (
    <div className="max-w-2xl space-y-6">
      <Link
        href="/dashboard/leads"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-[#14532d]"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to incoming requests
      </Link>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20">
              <CategoryIcon slug={request.category.slug} className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">{requestTitle}</h1>
              {request.serviceArea && (
                <p className="mt-0.5 flex items-center gap-1 text-sm text-gray-400">
                  <MapPin className="h-3.5 w-3.5" />
                  {request.serviceArea.name}
                </p>
              )}
            </div>
          </div>
          <span className="flex-shrink-0 rounded-full border border-green-200 bg-green-100 px-3 py-1.5 text-xs font-medium text-green-700">
            Open
          </span>
        </div>

        <div className="mb-5">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-gray-400">
            <FileText className="h-3.5 w-3.5" />
            Request description
          </p>
          <p className="whitespace-pre-line leading-relaxed text-gray-700 dark:text-gray-300">{request.description}</p>
        </div>

        <div className="grid grid-cols-1 gap-4 border-t border-gray-100 pt-5 dark:border-gray-800 sm:grid-cols-2">
          <Detail icon={<User className="h-4 w-4" />} label="Posted by">
            {requesterName}
          </Detail>
          <Detail icon={<Clock className="h-4 w-4" />} label="Created">
            {formatDate(request.createdAt)}
          </Detail>
          <Detail icon={<Tag className="h-4 w-4" />} label="Category">
            <CategoryIcon slug={request.category.slug} className="mr-1 inline h-4 w-4 -mt-0.5" />
            {request.category.name}
          </Detail>
          {request.serviceArea && (
            <Detail icon={<MapPin className="h-4 w-4" />} label="Location">
              {request.serviceArea.name}
            </Detail>
          )}
          {request.preferredDate && (
            <Detail icon={<CalendarDays className="h-4 w-4" />} label="Wanted by">
              {new Date(request.preferredDate).toLocaleDateString("en-CA", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </Detail>
          )}
          <Detail icon={CONTACT_ICON[request.preferredContact]} label="Preferred contact">
            {CONTACT_LABEL[request.preferredContact]}
          </Detail>
        </div>
      </div>

      {conversationData && (
        <div className="space-y-3">
          <h2 className="font-semibold text-gray-900 dark:text-white">Message the requester</h2>
          <ConversationThread
            conversationId={conversationData.conversation.id}
            currentUserId={conversationData.currentUserId}
            initialMessages={conversationData.conversation.messages.map((message) => ({
              id: message.id,
              senderId: message.senderId,
              senderName: displayName(message.sender),
              body: message.body,
              createdAt: message.createdAt.toISOString(),
            }))}
          />
        </div>
      )}

      <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 dark:border-emerald-800/40 dark:bg-emerald-900/20">
        <h2 className="font-semibold text-emerald-950 dark:text-emerald-100">Other contact methods</h2>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {whatsappHref && (
            <a href={whatsappHref} target="_blank" rel="noreferrer" className="w-full sm:w-auto">
              <Button className="w-full gap-1.5 bg-green-600 text-white hover:bg-green-700 sm:w-auto">
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </Button>
            </a>
          )}
          {request.contactEmail && (
            <a href={`mailto:${request.contactEmail}`} className="w-full sm:w-auto">
              <Button variant="outline" className="w-full gap-1.5 border-emerald-300 bg-white text-emerald-700 hover:bg-emerald-50 sm:w-auto">
                <Mail className="h-4 w-4" />
                Email
              </Button>
            </a>
          )}
          {request.contactPhone && (
            <a href={`tel:${request.contactPhone}`} className="w-full sm:w-auto">
              <Button variant="outline" className="w-full gap-1.5 border-emerald-300 bg-white text-emerald-700 hover:bg-emerald-50 sm:w-auto">
                <Phone className="h-4 w-4" />
                Call
              </Button>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function Detail({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 flex-shrink-0 text-gray-400">{icon}</span>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</p>
        <div className="mt-0.5 text-sm font-medium text-gray-800 dark:text-gray-200">{children}</div>
      </div>
    </div>
  );
}
