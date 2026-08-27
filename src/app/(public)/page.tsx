export const dynamic = "force-dynamic";

import Link from "next/link";
import Image from "next/image";
import {
  Building2, ShieldCheck, ArrowRight, CalendarDays, Sparkles, MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroSearch } from "@/components/home/hero-search";
import { CategorySearch } from "@/components/home/category-search";
import { FeaturedSection } from "@/components/featured/featured-section";
import { MinaretLogo } from "@/components/ui/minaret-logo";
import { CommunityOffersSection } from "@/components/offers/community-offers-section";
import { prisma } from "@/lib/prisma";
import { DEFAULT_MOSQUE_SLUG } from "@/lib/constants";
import { getPublicEventListings } from "@/lib/actions/event-listings";

const POPULAR_TAGS = [
  { label: "Plumber", href: "/professionals?category=plumber" },
  { label: "Family doctor", href: "/professionals?category=doctor" },
  { label: "Accountant", href: "/professionals?category=accountant" },
  { label: "Realtor", href: "/professionals?category=realtor" },
];

export default async function HomePage() {
  let categories: { id: string; name: string; slug: string; icon: string | null }[] = [];
  try {
    const mosque = await prisma.mosque.findUnique({
      where: { slug: DEFAULT_MOSQUE_SLUG },
      select: {
        categories: {
          where: { isActive: true },
          select: { id: true, name: true, slug: true, icon: true },
          orderBy: { name: "asc" },
        },
      },
    });
    categories = mosque?.categories ?? [];
  } catch {
    // fall through with empty list
  }

  let featuredEvents: Awaited<ReturnType<typeof getPublicEventListings>> = [];
  try {
    const all = await getPublicEventListings();
    featuredEvents = all.filter((e) => e.listingType === "FEATURED").slice(0, 3);
  } catch {
    // fall through
  }

  return (
    <div className="flex flex-col">

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="overflow-hidden">
        <div className="relative flex flex-col bg-[#071a0e] min-h-[580px] lg:min-h-[640px]">

          {/* Background image */}
          <Image
            src="/hero-team.jpg"
            alt=""
            fill
            preload
            fetchPriority="high"
            quality={80}
            sizes="100vw"
            className="absolute inset-0 w-full h-full object-cover object-[25%_15%] sm:object-center"
            aria-hidden="true"
          />
          {/* Green tint overlay */}
          <div className="absolute inset-0 pointer-events-none" style={{ background: "rgba(7,26,14,0.52)" }} />
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/30 via-transparent to-black/40" />

          {/* Main content — centered */}
          <div className="relative flex-1 flex flex-col items-center justify-center px-4 py-16 text-center">

            <div className="mb-8">
              <MinaretLogo variant="dark" />
            </div>

            <h1
              className="text-4xl sm:text-6xl lg:text-7xl font-bold text-white leading-[1.05] mb-5 max-w-4xl"
              style={{ fontFamily: "var(--font-lora)" }}
            >
              Find professionals from your mosque community.
            </h1>

            <p className="text-xl sm:text-2xl text-white/70 mb-10 leading-relaxed max-w-2xl" style={{ fontFamily: "var(--font-inter)" }}>
              Mosque-affiliated. Community recommended.
            </p>

            <HeroSearch light />

            {/* Popular tags */}
            <div className="flex flex-wrap items-center justify-center gap-x-1 gap-y-2 text-base mt-6">
              <span className="text-white/50 font-medium mr-1">Popular:</span>
              {POPULAR_TAGS.map((tag, i) => (
                <span key={tag.href} className="flex items-center gap-1">
                  <Link
                    href={tag.href}
                    className="text-white/75 hover:text-white hover:underline underline-offset-2 transition-colors"
                  >
                    {tag.label}
                  </Link>
                  {i < POPULAR_TAGS.length - 1 && (
                    <span className="text-white/30 select-none">·</span>
                  )}
                </span>
              ))}
            </div>
          </div>

        </div>

        {/* Trust bar */}
        <div className="bg-black py-4">
          <div className="container mx-auto px-4 lg:px-6 flex flex-wrap justify-center gap-6 sm:gap-12">
            {[
              { icon: Building2,   label: "Mosque affiliated" },
              { icon: Star,        label: "Community recommended" },
              { icon: ShieldCheck, label: "Admin approved" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-sm text-white font-medium">
                <Icon className="h-4 w-4 text-white/70 flex-shrink-0" />
                {label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Businesses ──────────────────────────────── */}
      <FeaturedSection />

      {/* ── Community Offers ─────────────────────────────────── */}
      <CommunityOffersSection />

      {/* ── Featured Events ──────────────────────────────────── */}
      {featuredEvents.length > 0 && (
        <section className="bg-white dark:bg-gray-950 border-b border-gray-100 dark:border-gray-900 py-16">
          <div className="container mx-auto px-4 lg:px-6 max-w-6xl">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-violet-600" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: "var(--font-lora)" }}>
                  Featured Community Events
                </h2>
              </div>
              <Link href="/events" className="text-sm font-medium text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1">
                All events <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {featuredEvents.map((event) => (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="group flex flex-col rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden transition hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-md"
                >
                  <div className="relative w-full aspect-[16/9] bg-violet-50 dark:bg-violet-900/20 overflow-hidden">
                    {event.imageUrl ? (
                      <Image src={event.imageUrl} alt={event.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <CalendarDays className="h-10 w-10 text-violet-300 dark:text-violet-700" />
                      </div>
                    )}
                    <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 rounded-full bg-violet-600 px-2 py-0.5 text-[11px] font-semibold text-white shadow">
                      <Sparkles className="h-2.5 w-2.5" /> Featured
                    </span>
                  </div>
                  <div className="flex flex-col flex-1 p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-violet-700 dark:group-hover:text-violet-400 transition-colors leading-snug mb-1">
                      {event.title}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 flex-1 mb-3">{event.description}</p>
                    <div className="space-y-1">
                      <p className="text-xs text-gray-600 dark:text-gray-300 flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5 text-violet-600 flex-shrink-0" />
                        {new Date(event.eventDate).toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                        {event.location}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Community Events CTA ─────────────────────────────── */}
      <section className="bg-emerald-50 dark:bg-emerald-950/30 border-y border-emerald-100 dark:border-emerald-900/50 py-20">
        <div className="container mx-auto px-4 lg:px-6 max-w-5xl">
          <div className="flex flex-col md:flex-row items-center gap-10">
            <div className="flex-shrink-0 flex items-center justify-center h-24 w-24 rounded-3xl bg-emerald-700 shadow-lg">
              <CalendarDays className="h-12 w-12 text-white" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center gap-2 mb-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Community events</p>
                <span className="inline-flex items-center bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full">
                  Free now
                </span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3 leading-snug" style={{ fontFamily: "var(--font-lora)" }}>
                Reach GTA mosque communities with your event.
              </h2>
              <p className="text-gray-500 dark:text-gray-400 leading-relaxed mb-6 max-w-lg">
                Whether it&apos;s a fundraiser, bazaar, lecture, or community dinner — post it here and get it in front of thousands of GTA Muslims who are actively looking for events like yours.{" "}
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">Posting is free during our launch period.</span>
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                <Link href="/events/submit">
                  <Button size="lg" className="bg-emerald-700 hover:bg-emerald-800 text-white h-12 px-8 shadow-sm font-semibold">
                    Post an Event — It&apos;s Free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/events">
                  <Button size="lg" variant="outline" className="h-12 px-8 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:border-emerald-300 font-medium">
                    Browse events
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Browse by Category ────────────────────────────────── */}
      <section className="container mx-auto px-4 lg:px-6 py-14">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 mb-1">Browse by profession or business</p>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-5" style={{ fontFamily: "var(--font-lora)" }}>
            Find a professional or local business
          </h2>
          <CategorySearch categories={categories} />
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="container mx-auto px-4 lg:px-6 py-24 text-center">
        <div className="max-w-xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 mb-3">For professionals</p>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white tracking-tight mb-4" style={{ fontFamily: "var(--font-lora)" }}>
            Are you a professional?
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
            Join our network and connect with mosque members looking for community-affiliated professionals like you.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/professionals/register">
              <Button size="lg" className="bg-gray-900 hover:bg-gray-800 text-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 h-12 px-8 shadow-sm font-medium">
                Join as a professional
              </Button>
            </Link>
            <Link href="/professionals">
              <Button size="lg" variant="outline" className="h-12 px-8 border-gray-200 hover:border-gray-300 text-gray-700 dark:text-gray-300 font-medium">
                Browse the directory
              </Button>
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
