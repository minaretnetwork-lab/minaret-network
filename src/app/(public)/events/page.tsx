export const dynamic = "force-dynamic";

import Link from "next/link";
import { CalendarDays, MapPin, Sparkles, Plus } from "lucide-react";
import { getPublicEventListings } from "@/lib/actions/event-listings";
import { EventDisclaimer } from "@/components/events/event-disclaimer";

export const metadata = {
  title: "Community Events | Minaret Network",
  description: "Local events posted by mosque communities and community organizers across the GTA.",
};

function formatEventDate(d: Date) {
  return new Date(d).toLocaleDateString("en-CA", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function EventsPage() {
  const events = await getPublicEventListings();
  const featured = events.filter((e) => e.listingType === "FEATURED");
  const standard = events.filter((e) => e.listingType === "STANDARD");

  return (
    <main className="min-h-[70vh] bg-white dark:bg-gray-950">
      <div className="container mx-auto max-w-4xl px-4 py-12">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <h1
              className="text-3xl font-bold text-gray-900 dark:text-white"
              style={{ fontFamily: "var(--font-lora)" }}
            >
              Community Events
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Events posted by mosque communities and organizers across the GTA.
            </p>
          </div>
          <Link
            href="/events/submit"
            className="flex-shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Post an Event
          </Link>
        </div>

        {/* Site-wide disclaimer — always visible */}
        <div className="mb-8">
          <EventDisclaimer />
        </div>

        {events.length === 0 ? (
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 py-16 text-center">
            <CalendarDays className="mx-auto h-10 w-10 text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">No events yet</p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Be the first to post a community event.
            </p>
            <Link
              href="/events/submit"
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 transition-colors"
            >
              Post an Event
            </Link>
          </div>
        ) : (
          <div className="space-y-10">
            {featured.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="h-4 w-4 text-violet-600" />
                  <h2 className="text-xs font-bold uppercase tracking-widest text-violet-600">Featured Events</h2>
                </div>
                <div className="space-y-3">
                  {featured.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              </section>
            )}

            {standard.length > 0 && (
              <section>
                {featured.length > 0 && (
                  <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">All Events</h2>
                )}
                <div className="space-y-3">
                  {standard.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function EventCard({
  event,
}: {
  event: Awaited<ReturnType<typeof getPublicEventListings>>[number];
}) {
  return (
    <Link
      href={`/events/${event.id}`}
      className="group block rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 transition hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {event.listingType === "FEATURED" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-700 px-2 py-0.5 text-[11px] font-semibold text-violet-700 dark:text-violet-300">
                <Sparkles className="h-2.5 w-2.5" />
                Featured
              </span>
            )}
            {event.isMosqueOrganized && event.mosqueName && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                🕌 {event.mosqueName}
              </span>
            )}
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-emerald-700 transition-colors leading-snug">
            {event.title}
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{event.description}</p>
        </div>
        <div className="flex-shrink-0 text-right space-y-1">
          <p className="text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1 justify-end">
            <CalendarDays className="h-3.5 w-3.5 text-gray-400" />
            {formatEventDate(event.eventDate)}
          </p>
          <p className="text-xs text-gray-400 flex items-center gap-1 justify-end">
            <MapPin className="h-3.5 w-3.5" />
            {event.location}
          </p>
        </div>
      </div>
    </Link>
  );
}
