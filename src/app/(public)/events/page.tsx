export const dynamic = "force-dynamic";

import Link from "next/link";
import Image from "next/image";
import { CalendarDays, MapPin, Sparkles, Plus } from "lucide-react";
import { getPublicEventListings } from "@/lib/actions/event-listings";
import { EventDisclaimer } from "@/components/events/event-disclaimer";
import { EventImageViewer } from "@/components/events/event-image-viewer";

export const metadata = {
  title: "Community Events",
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
      <div className="container mx-auto max-w-6xl px-4 py-12">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
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

        <div className="mb-8">
          <EventDisclaimer />
        </div>

        {events.length === 0 ? (
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 py-16 text-center">
            <CalendarDays className="mx-auto h-10 w-10 text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">No events yet</p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Be the first to post a community event.</p>
            <Link
              href="/events/submit"
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 transition-colors"
            >
              Post an Event
            </Link>
          </div>
        ) : (
          <div className="space-y-12">
            {featured.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-5">
                  <Sparkles className="h-4 w-4 text-violet-600" />
                  <h2 className="text-xs font-bold uppercase tracking-widest text-violet-600">Featured Events</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {featured.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              </section>
            )}

            {standard.length > 0 && (
              <section>
                {featured.length > 0 && (
                  <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-5">All Events</h2>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
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
      className="group flex flex-col rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden transition hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-md"
    >
      {/* Image */}
      <div className="relative w-full aspect-[16/9] bg-gray-900 overflow-hidden">
        {event.imageUrl ? (
          <>
            {/* blurred background fill */}
            <Image
              src={event.imageUrl}
              alt=""
              fill
              aria-hidden
              className="object-cover scale-110 blur-md opacity-40"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
            {/* actual image, contained */}
            <Image
              src={event.imageUrl}
              alt={event.title}
              fill
              className="object-contain"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <CalendarDays className="h-10 w-10 text-emerald-300 dark:text-emerald-700" />
          </div>
        )}

        {/* Zoom button */}
        {event.imageUrl && <EventImageViewer src={event.imageUrl} alt={event.title} />}

        {/* Badges overlaid on image */}
        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
          {event.listingType === "FEATURED" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-violet-600 px-2 py-0.5 text-[11px] font-semibold text-white shadow">
              <Sparkles className="h-2.5 w-2.5" />
              Featured
            </span>
          )}
          {event.isMosqueOrganized && event.mosqueName && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/90 dark:bg-gray-900/90 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 shadow">
              🕌 {event.mosqueName}
            </span>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="flex flex-col flex-1 p-4">
        <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors leading-snug mb-1">
          {event.title}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 flex-1 mb-3">
          {event.description}
        </p>
        <div className="space-y-1">
          <p className="text-xs text-gray-600 dark:text-gray-300 flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
            {event.eventEndDate && formatEventDate(event.eventEndDate) !== formatEventDate(event.eventDate)
              ? `${formatEventDate(event.eventDate)} – ${formatEventDate(event.eventEndDate)}`
              : formatEventDate(event.eventDate)}
            {event.isRecurring && " 🔁"}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
            {event.location}
          </p>
        </div>
      </div>
    </Link>
  );
}
