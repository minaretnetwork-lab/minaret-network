export const dynamic = "force-dynamic";

import Link from "next/link";
import Image from "next/image";
import {
  Search, Phone, Handshake, Star, Users,
  Stethoscope, Hammer, Scale, DollarSign, Home,
  Monitor, GraduationCap, LayoutGrid, Building2, ShieldCheck, ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroSearch } from "@/components/home/hero-search";
import { CommunityCycle } from "@/components/home/community-cycle";
import { FeaturedSection } from "@/components/featured/featured-section";
import { SponsoredLogoCarousel } from "@/components/home/sponsored-logo-carousel";

interface HomePageProps {
  searchParams: Promise<{ featured_city?: string }>;
}

const BROAD_CATEGORIES = [
  { label: "Health", icon: Stethoscope, href: "/professionals?category=doctor" },
  { label: "Trades", icon: Hammer, href: "/professionals?category=electrician" },
  { label: "Legal", icon: Scale, href: "/professionals?category=lawyer" },
  { label: "Finance", icon: DollarSign, href: "/professionals?category=accountant" },
  { label: "Real estate", icon: Home, href: "/professionals?category=realtor" },
  { label: "Tech", icon: Monitor, href: "/professionals?category=it-consultant" },
  { label: "Education", icon: GraduationCap, href: "/professionals?category=tutor" },
] as const;

const POPULAR_TAGS = [
  { label: "Plumber", href: "/professionals?category=plumber" },
  { label: "Family doctor", href: "/professionals?category=doctor" },
  { label: "Accountant", href: "/professionals?category=accountant" },
  { label: "Realtor", href: "/professionals?category=realtor" },
];

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const featuredCity = params.featured_city;

  return (
    <div className="flex flex-col">

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="bg-white overflow-hidden">
        <div className="flex min-h-[460px] lg:min-h-[520px]">

          {/* Left — search content */}
          <div className="flex-1 flex flex-col justify-center px-6 sm:px-10 lg:px-14 xl:px-20 pt-8 pb-10 lg:pt-10 lg:pb-12">
            <div className="w-full">

              <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-full px-4 py-1.5 text-sm text-emerald-700 font-medium mb-6">
                GTA Masjid Professional Directory
              </div>

              <h1
                className="text-5xl sm:text-6xl lg:text-6xl xl:text-7xl font-bold text-gray-900 leading-[1.05] mb-4"
                style={{ fontFamily: "var(--font-lora)" }}
              >
                Find professionals from your mosque community.
              </h1>

              <p className="text-lg text-gray-500 mb-7 leading-relaxed" style={{ fontFamily: "var(--font-inter)" }}>
                Verified by mosque admins. Recommended by your community.
              </p>

              <HeroSearch light />

              {/* Popular tags */}
              <div className="flex flex-wrap items-center gap-x-1 gap-y-2 text-sm mt-5">
                <span className="text-gray-400 font-medium mr-1">Popular:</span>
                {POPULAR_TAGS.map((tag, i) => (
                  <span key={tag.href} className="flex items-center gap-1">
                    <Link
                      href={tag.href}
                      className="text-gray-600 hover:text-emerald-700 hover:underline underline-offset-2 transition-colors"
                    >
                      {tag.label}
                    </Link>
                    {i < POPULAR_TAGS.length - 1 && (
                      <span className="text-gray-300 select-none">·</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right — illustration panel */}
          <div className="hidden lg:block lg:w-[44%] xl:w-[46%] relative overflow-hidden bg-[#071a0e]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/mosque2.jpg"
              alt=""
              className="absolute inset-0 w-full h-full object-cover object-top"
              aria-hidden="true"
            />
            {/* Subtle left-edge fade so it blends into the white left column */}
            <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-white/20 to-transparent" aria-hidden="true" />
          </div>

        </div>

        {/* Trust bar — full width below the two columns */}
        <div className="bg-[#14532d] py-4">
          <div className="container mx-auto px-4 lg:px-6 flex flex-wrap justify-center gap-6 sm:gap-12">
            {[
              { icon: Building2,   label: "Mosque affiliated" },
              { icon: Star,        label: "Community recommended" },
              { icon: ShieldCheck, label: "Admin approved" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-sm text-white/90">
                <Icon className="h-4 w-4 text-white flex-shrink-0" />
                {label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Browse by Category ────────────────────────────────── */}
      <section className="container mx-auto px-4 lg:px-6 py-14">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 mb-1">Browse by profession</p>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: "var(--font-lora)" }}>
              What do you need help with?
            </h2>
          </div>
          <Link href="/categories" className="hidden sm:flex items-center gap-1 text-sm font-medium text-emerald-700 hover:text-emerald-800 dark:text-emerald-400">
            All categories <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5">
          {BROAD_CATEGORIES.map(({ label, icon: Icon, href }) => (
            <Link
              key={label}
              href={href}
              className="group flex flex-col items-center gap-2.5 p-3 sm:p-4 rounded-2xl border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/60 transition-all duration-200"
            >
              <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                <Icon className="h-5 w-5 text-emerald-600" />
              </div>
              <span className="text-[11px] sm:text-xs font-medium text-gray-600 group-hover:text-emerald-700 leading-tight text-center transition-colors">
                {label}
              </span>
            </Link>
          ))}
          <Link
            href="/categories"
            className="group flex flex-col items-center gap-2.5 p-3 sm:p-4 rounded-2xl border border-dashed border-gray-200 hover:border-emerald-200 hover:bg-emerald-50/60 transition-all duration-200"
          >
            <div className="h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
              <LayoutGrid className="h-5 w-5 text-gray-400 group-hover:text-emerald-600 transition-colors" />
            </div>
            <span className="text-[11px] sm:text-xs font-medium text-gray-400 group-hover:text-emerald-700 leading-tight text-center transition-colors">
              All 25+
            </span>
          </Link>
        </div>
      </section>

      {/* ── Sponsor Logo Carousel ───────────────────────────── */}
      <SponsoredLogoCarousel />

      {/* ── Featured Businesses ──────────────────────────────── */}
      <FeaturedSection city={featuredCity} />

      {/* ── Quranic Verse ────────────────────────────────────── */}
      <section className="bg-white dark:bg-gray-950 border-b border-gray-100 dark:border-gray-900 py-16">
        <div className="container mx-auto px-4 lg:px-6 max-w-2xl text-center">
          <p
            className="text-2xl md:text-3xl lg:text-4xl text-emerald-700 dark:text-emerald-400 leading-loose mb-4 tracking-wide"
            style={{ fontFamily: "var(--font-lora)", direction: "rtl" }}
          >
            لِتَعَارَفُوا
          </p>
          <p
            className="text-base md:text-lg lg:text-xl text-gray-600 dark:text-gray-300 leading-loose mb-6"
            style={{ fontFamily: "var(--font-lora)", direction: "rtl" }}
          >
            يَا أَيُّهَا النَّاسُ إِنَّا خَلَقْنَاكُم مِّن ذَكَرٍ وَأُنثَىٰ وَجَعَلْنَاكُمْ شُعُوبًا وَقَبَائِلَ لِتَعَارَفُوا
          </p>
          <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 italic mb-3 leading-relaxed">
            &ldquo;O mankind, We created you from a single pair and made you into nations and tribes — so that you may know one another.&rdquo;
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-600 tracking-wide uppercase">
            Surah Al-Hujurat &mdash; 49:13
          </p>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────── */}
      <section className="container mx-auto px-4 lg:px-6 py-20">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 mb-2">Simple process</p>
          <h2
            className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white tracking-tight"
            style={{ fontFamily: "var(--font-lora)" }}
          >
            How it works
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto relative">
          <div className="hidden md:block absolute top-10 left-[calc(16.67%+2rem)] right-[calc(16.67%+2rem)] h-px bg-gradient-to-r from-emerald-200 via-emerald-300 to-emerald-200" aria-hidden="true" />
          {[
            { icon: <Search className="h-6 w-6 text-emerald-600" />, step: "1", title: "Search", description: "Browse by profession or service area. Filter by language, location, and more." },
            { icon: <Phone  className="h-6 w-6 text-emerald-600" />, step: "2", title: "Contact", description: "View their full profile, read community recommendations, then reach out directly." },
            { icon: <Handshake className="h-6 w-6 text-emerald-600" />, step: "3", title: "Hire", description: "Work with confidence. Leave a recommendation to help the community." },
          ].map((item) => (
            <div key={item.step} className="flex flex-col items-center text-center">
              <div className="relative mb-6">
                <div className="h-20 w-20 rounded-2xl bg-white dark:bg-white/5 border border-border shadow-sm flex items-center justify-center">
                  {item.icon}
                </div>
                <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center shadow-sm">
                  {item.step}
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2" style={{ fontFamily: "var(--font-lora)" }}>{item.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed max-w-[220px]">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Trust Section ────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#0a2e1a] text-white py-20">
        <div className="absolute inset-0 opacity-[0.06]" aria-hidden="true">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="geo2" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                <polygon points="30,2 58,16 58,44 30,58 2,44 2,16" fill="none" stroke="white" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#geo2)"/>
          </svg>
        </div>
        <div className="relative container mx-auto px-4 lg:px-6">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-2">Built on trust</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight" style={{ fontFamily: "var(--font-lora)" }}>
              Why the community trusts us
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-3xl mx-auto">
            {[
              { icon: <Handshake className="h-6 w-6" />, title: "Mosque affiliated",          desc: "Every professional is confirmed by a mosque admin as a member of that congregation." },
              { icon: <Star      className="h-6 w-6" />, title: "Community recommendations",  desc: "Recommendations are submitted by community members and reviewed before they go live." },
              { icon: <Users     className="h-6 w-6" />, title: "Admin approved",              desc: "Each listing is reviewed and approved by our administration before appearing in the directory." },
            ].map((item) => (
              <div key={item.title} className="text-center">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-white/8 border border-white/10 text-emerald-400 mb-5 mx-auto">
                  {item.icon}
                </div>
                <h3 className="font-semibold text-white mb-2" style={{ fontFamily: "var(--font-lora)" }}>{item.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Community Circle ─────────────────────────────────── */}
      <CommunityCycle />

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="container mx-auto px-4 lg:px-6 py-24 text-center">
        <div className="max-w-xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 mb-3">For professionals</p>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white tracking-tight mb-4" style={{ fontFamily: "var(--font-lora)" }}>
            Are you a professional?
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
            Join our network and connect with mosque members looking for trusted professionals like you. Verification ensures your credibility stands out.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/professionals/register">
              <Button size="lg" className="bg-gray-900 hover:bg-gray-800 text-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 h-12 px-8 shadow-sm font-medium">
                Become a professional
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
