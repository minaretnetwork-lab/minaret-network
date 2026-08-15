export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CalendarDays, MapPin, User, Sparkles } from "lucide-react";
import { getPublicEventListing } from "@/lib/actions/event-listings";
import { EventDisclaimer } from "@/components/events/event-disclaimer";
import { ReportEventButton } from "@/components/events/report-event-button";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await getPublicEventListing(id);
  if (!event) return { title: "Event Not Found" };
  return {
    title: `${event.title} | Minaret Network Events`,
    description: event.description.slice(0, 160),
  };
}

function formatEventDate(d: Date) {
  return new Date(d).toLocaleDateString("en-CA", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await getPublicEventListing(id);

  if (!event) notFound();

  return (
    <main className="min-h-[70vh] bg-white dark:bg-gray-950">
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <Link
          href="/events"
          className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-emerald-700 dark:text-gray-400 dark:hover:text-emerald-400 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Events
        </Link>

        <article className="space-y-6">
          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            {event.listingType === "FEATURED" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-700 px-3 py-1 text-xs font-semibold text-violet-700 dark:text-violet-300">
                <Sparkles className="h-3 w-3" />
                Featured
              </span>
            )}
            {event.isMosqueOrganized && event.mosqueName && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                🕌 Organized by {event.mosqueName}
              </span>
            )}
          </div>

          {/* Title */}
          <h1
            className="text-3xl font-bold text-gray-900 dark:text-white leading-tight"
            style={{ fontFamily: "var(--font-lora)" }}
          >
            {event.title}
          </h1>

          {/* Meta */}
          <div className="flex flex-col sm:flex-row gap-4 text-sm text-gray-600 dark:text-gray-400">
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-emerald-600 flex-shrink-0" />
              {formatEventDate(event.eventDate)}
            </span>
            <span className="inline-flex items-center gap-2">
              <MapPin className="h-4 w-4 text-emerald-600 flex-shrink-0" />
              {event.location}
            </span>
          </div>

          {/* Disclaimer — always visible per spec */}
          <EventDisclaimer />

          {/* Description */}
          <div className="rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-6">
            <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {event.description}
            </p>
          </div>

          {/* Organizer */}
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-800 pt-4">
            <User className="h-4 w-4 flex-shrink-0" />
            <span>Posted by <strong className="text-gray-700 dark:text-gray-300">{event.organizerName}</strong></span>
          </div>

          {/* Report */}
          <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
            <ReportEventButton eventListingId={event.id} />
          </div>
        </article>
      </div>
    </main>
  );
}
