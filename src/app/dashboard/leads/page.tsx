import Link from "next/link";
import { CalendarDays, Clock, Mail, MapPin, MessageCircle, Phone, Send } from "lucide-react";
import { getMatchingServiceRequests } from "@/lib/actions/service-requests";
import { startConversationForServiceRequest } from "@/lib/actions/messages";
import { Button } from "@/components/ui/button";
import { CategoryIcon } from "@/components/ui/category-icon";
import { buildWhatsAppUrl, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Incoming Service Requests" };

const CONTACT_ICON: Record<string, React.ReactNode> = {
  EMAIL: <Mail className="h-3.5 w-3.5" />,
  PHONE: <Phone className="h-3.5 w-3.5" />,
  WHATSAPP: <MessageCircle className="h-3.5 w-3.5" />,
};

const STATUS_BADGE: Record<string, string> = {
  OPEN: "border-green-200 bg-green-100 text-green-700",
  IN_PROGRESS: "border-blue-200 bg-blue-100 text-blue-700",
  CLOSED: "border-gray-200 bg-gray-100 text-gray-600",
  CANCELLED: "border-red-200 bg-red-100 text-red-700",
};

function personName(user?: { displayName: string | null; firstName: string | null; lastName: string | null } | null) {
  if (!user) return "Professional";
  return user.firstName || user.displayName || [user.firstName, user.lastName].filter(Boolean).join(" ") || "Professional";
}

export default async function MatchingRequestsPage() {
  const requests = await getMatchingServiceRequests();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Incoming Service Requests</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Service requests that match your approved listing categories and service areas.
        </p>
      </div>

      {requests.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white py-16 text-center dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-4 flex justify-center">
            <Send className="h-12 w-12 text-gray-300" />
          </div>
          <h2 className="mb-2 font-semibold text-gray-900 dark:text-white">No matching requests right now</h2>
          <p className="mx-auto max-w-md text-sm text-gray-500 dark:text-gray-400">
            When someone submits a request in one of your listing categories and service areas, it will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((request) => {
            const professional = request.matchedProfessional;
            const ownerName = personName(professional?.user);
            const businessName = professional?.businessName || professional?.title || request.category.name;
            const contactTitle = professional ? `${ownerName} at ${businessName}` : request.category.name;
            const isClosed = request.status === "CLOSED" || request.status === "CANCELLED";
            const whatsappHref = request.contactPhone
              ? buildWhatsAppUrl(
                  request.contactPhone,
                  `Hi ${request.contactName ?? "there"}, I saw your request on Minaret Network and may be able to help.`
                )
              : null;

            return (
              <article
                key={request.id}
                className="group relative rounded-xl border border-gray-200 bg-white p-5 transition-colors hover:border-emerald-300 dark:border-gray-800 dark:bg-gray-900"
              >
                <Link
                  href={`/dashboard/leads/${request.id}`}
                  aria-label={`View details for ${contactTitle}`}
                  className="absolute inset-0 z-0 rounded-xl"
                />
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20">
                      <CategoryIcon slug={request.category.slug} className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-semibold text-gray-900 transition-colors group-hover:text-emerald-700 dark:text-white">
                          {contactTitle}
                        </h2>
                        {request.serviceArea && (
                          <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                            <MapPin className="h-3 w-3" />
                            {request.serviceArea.name}
                          </span>
                        )}
                      </div>
                      <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                        {request.description}
                      </p>
                      <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs text-gray-400">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          Created {formatDate(request.createdAt)}
                        </span>
                        {request.preferredDate && (
                          <span className="inline-flex items-center gap-1">
                            <CalendarDays className="h-3.5 w-3.5" />
                            Wanted {new Date(request.preferredDate).toLocaleDateString("en-CA", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          {CONTACT_ICON[request.preferredContact]}
                          Prefers {request.preferredContact === "WHATSAPP" ? "WhatsApp" : request.preferredContact.toLowerCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className={`flex-shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium ${STATUS_BADGE[request.status] ?? STATUS_BADGE.OPEN}`}>
                    {request.status.replace("_", " ")}
                  </span>
                </div>

                {isClosed && request.closeReason && (
                  <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-300">
                    <p className="font-medium text-gray-800 dark:text-gray-100">Closed: {request.closeReason}</p>
                    {request.closeNote && <p className="mt-1">{request.closeNote}</p>}
                    {request.closedAt && <p className="mt-1 text-xs text-gray-400">Closed {formatDate(request.closedAt)}</p>}
                  </div>
                )}

                <div className="relative z-10 mt-4 flex flex-col gap-2 border-t border-gray-100 pt-3 dark:border-gray-800 sm:flex-row sm:flex-wrap sm:justify-end">
                  {isClosed ? (
                    request.conversationId ? (
                      <Link href={`/dashboard/messages/${request.conversationId}`} className="w-full sm:w-auto">
                        <Button variant="outline" size="sm" className="w-full gap-1.5 border-gray-200 text-gray-600 hover:bg-gray-50 sm:w-auto">
                          <MessageCircle className="h-4 w-4" />
                          View Chat
                        </Button>
                      </Link>
                    ) : null
                  ) : request.conversationId ? (
                    <Link href={`/dashboard/messages/${request.conversationId}`} className="w-full sm:w-auto">
                      <Button size="sm" className="w-full gap-1.5 bg-emerald-700 text-white hover:bg-emerald-800 sm:w-auto">
                        <MessageCircle className="h-4 w-4" />
                        Continue Chat
                      </Button>
                    </Link>
                  ) : (
                    <form action={startConversationForServiceRequest.bind(null, request.id)} className="w-full sm:w-auto">
                      <Button type="submit" size="sm" className="w-full gap-1.5 bg-emerald-700 text-white hover:bg-emerald-800 sm:w-auto">
                        <MessageCircle className="h-4 w-4" />
                        Message
                      </Button>
                    </form>
                  )}
                  {!isClosed && whatsappHref && (
                    <a href={whatsappHref} target="_blank" rel="noreferrer" className="w-full sm:w-auto">
                      <Button size="sm" className="w-full gap-1.5 bg-green-600 text-white hover:bg-green-700 sm:w-auto">
                        <MessageCircle className="h-4 w-4" />
                        WhatsApp
                      </Button>
                    </a>
                  )}
                  {!isClosed && request.contactEmail && (
                    <a href={`mailto:${request.contactEmail}`} className="w-full sm:w-auto">
                      <Button variant="outline" size="sm" className="w-full gap-1.5 border-emerald-200 text-emerald-700 hover:bg-emerald-50 sm:w-auto">
                        <Mail className="h-4 w-4" />
                        Email
                      </Button>
                    </a>
                  )}
                  {!isClosed && request.contactPhone && (
                    <a href={`tel:${request.contactPhone}`} className="w-full sm:w-auto">
                      <Button variant="outline" size="sm" className="w-full gap-1.5 border-emerald-200 text-emerald-700 hover:bg-emerald-50 sm:w-auto">
                        <Phone className="h-4 w-4" />
                        Call
                      </Button>
                    </a>
                  )}
                  <Link href={`/dashboard/leads/${request.id}`} className="sr-only">
                    <Button variant="outline" size="sm">
                      Open details
                    </Button>
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
