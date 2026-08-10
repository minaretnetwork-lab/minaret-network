export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft, Clock, MapPin, Phone, Mail, MessageCircle,
  UserCheck, CalendarDays, Tag, FileText,
} from "lucide-react";
import { getServiceRequestById } from "@/lib/actions/service-requests";
import { getConversationsForMyRequest } from "@/lib/actions/messages";
import { CategoryIcon } from "@/components/ui/category-icon";
import { formatDate } from "@/lib/utils";

interface Props {
  params: Promise<{ id: string }>;
}

const STATUS_STYLES: Record<string, { pill: string; label: string }> = {
  OPEN:        { pill: "bg-green-100 text-green-700 border-green-200",  label: "Open" },
  IN_PROGRESS: { pill: "bg-blue-100 text-blue-700 border-blue-200",    label: "In Progress" },
  CLOSED:      { pill: "bg-gray-100 text-gray-600 border-gray-200",    label: "Closed" },
  CANCELLED:   { pill: "bg-red-100 text-red-700 border-red-200",       label: "Cancelled" },
};

const CONTACT_LABEL: Record<string, string> = {
  EMAIL: "Email", PHONE: "Phone", WHATSAPP: "WhatsApp",
};

const CONTACT_ICON: Record<string, React.ReactNode> = {
  EMAIL:    <Mail className="h-4 w-4" />,
  PHONE:    <Phone className="h-4 w-4" />,
  WHATSAPP: <MessageCircle className="h-4 w-4" />,
};

export default async function RequestDetailPage({ params }: Props) {
  const { id } = await params;
  const [req, conversations] = await Promise.all([
    getServiceRequestById(id),
    getConversationsForMyRequest(id),
  ]);

  if (!req) notFound();

  const ui = STATUS_STYLES[req.status] ?? STATUS_STYLES.OPEN;
  const assignedName = req.assignedTo
    ? (req.assignedTo.user.displayName ??
       [req.assignedTo.user.firstName, req.assignedTo.user.lastName].filter(Boolean).join(" "))
    : null;

  return (
    <div className="max-w-2xl space-y-6">
      {/* Back */}
      <Link
        href="/dashboard/requests"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#14532d] transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to My Requests
      </Link>

      {/* Header card */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center">
              <CategoryIcon slug={req.category.slug} className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">{req.category.name}</h1>
              {req.serviceArea && (
                <p className="text-sm text-gray-400 flex items-center gap-1 mt-0.5">
                  <MapPin className="h-3.5 w-3.5" /> {req.serviceArea.name}
                </p>
              )}
            </div>
          </div>
          <span className={`text-xs px-3 py-1.5 rounded-full font-medium border flex-shrink-0 ${ui.pill}`}>
            {ui.label}
          </span>
        </div>

        {/* Description */}
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2 flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5" /> Description
          </p>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">{req.description}</p>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-5 border-t border-gray-100 dark:border-gray-800">
          <Detail icon={<Clock className="h-4 w-4" />} label="Submitted">
            {formatDate(req.createdAt)}
          </Detail>

          <Detail icon={<Tag className="h-4 w-4" />} label="Category">
            <CategoryIcon slug={req.category.slug} className="inline h-4 w-4 mr-1 -mt-0.5" />{req.category.name}
          </Detail>

          <Detail icon={CONTACT_ICON[req.preferredContact]} label="Preferred contact">
            {CONTACT_LABEL[req.preferredContact]}
            {req.contactValue && (
              <span className="block text-gray-500 text-xs mt-0.5">{req.contactValue}</span>
            )}
          </Detail>

          {req.preferredDate && (
            <Detail icon={<CalendarDays className="h-4 w-4" />} label="Preferred date">
              {new Date(req.preferredDate).toLocaleDateString("en-CA", {
                weekday: "long", month: "long", day: "numeric", year: "numeric",
              })}
            </Detail>
          )}
        </div>
      </div>

      {/* Assigned professional */}
      {assignedName && req.assignedTo && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/40 rounded-2xl p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 mb-3 flex items-center gap-1.5">
            <UserCheck className="h-3.5 w-3.5" /> Assigned Professional
          </p>
          <Link
            href={`/professionals/${req.assignedTo.id}`}
            className="font-semibold text-emerald-700 dark:text-emerald-400 hover:underline text-lg"
          >
            {assignedName}
          </Link>
          <p className="text-sm text-emerald-600/70 mt-1">Click to view their full profile</p>
        </div>
      )}

      {conversations.length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h2 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
            <MessageCircle className="h-4 w-4 text-emerald-600" />
            Conversations about this request
          </h2>
          <div className="mt-4 space-y-2">
            {conversations.map((conversation) => {
              const proName =
                conversation.professional.user.displayName ||
                [conversation.professional.user.firstName, conversation.professional.user.lastName].filter(Boolean).join(" ") ||
                conversation.professional.user.email;
              const lastMessage = conversation.messages[0];

              return (
                <Link
                  key={conversation.id}
                  href={`/dashboard/messages/${conversation.id}`}
                  className="block rounded-xl border border-gray-100 bg-gray-50 p-3 transition hover:border-emerald-200 hover:bg-emerald-50 dark:border-gray-800 dark:bg-gray-950 dark:hover:bg-emerald-900/10"
                >
                  <p className="font-medium text-gray-900 dark:text-white">{proName}</p>
                  <p className="mt-1 truncate text-sm text-gray-500 dark:text-gray-400">
                    {lastMessage?.body ?? "Open the thread to reply."}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Status message for open requests */}
      {req.status === "OPEN" && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/40 rounded-2xl p-5 text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
          Your request is open and visible to matching professionals in the mosque network. You will be contacted via your preferred method when someone reaches out.
        </div>
      )}
    </div>
  );
}

function Detail({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="text-gray-400 mt-0.5 flex-shrink-0">{icon}</span>
      <div>
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</p>
        <div className="text-sm font-medium text-gray-800 dark:text-gray-200 mt-0.5">{children}</div>
      </div>
    </div>
  );
}
