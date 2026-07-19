export const dynamic = "force-dynamic";

import Link from "next/link";
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
  { label: "Tax preparer", href: "/professionals?category=tax-preparer" },
  { label: "Realtor", href: "/professionals?category=realtor" },
];

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const featuredCity = params.featured_city;

  return (
    <div className="flex flex-col">

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="bg-white overflow-hidden">
        <div className="flex min-h-[580px] lg:min-h-[640px]">

          {/* Left — search content */}
          <div className="flex-1 flex flex-col justify-center px-6 sm:px-10 lg:px-14 xl:px-20 py-14">
            <div className="max-w-lg">

              <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-full px-4 py-1.5 text-sm text-emerald-700 font-medium mb-6">
                GTA Masjid Professional Directory
              </div>

              <h1
                className="text-4xl sm:text-5xl font-bold text-gray-900 leading-[1.1] mb-4"
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

          {/* Right — forest green mosque illustration */}
          <div className="hidden lg:flex lg:w-[44%] xl:w-[46%] bg-[#1a4731] relative overflow-hidden items-end justify-center">
            <svg
              viewBox="0 0 480 560"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full object-cover"
              aria-hidden="true"
            >
              <defs>
                <pattern id="dotgrid" width="22" height="22" patternUnits="userSpaceOnUse">
                  <circle cx="2" cy="2" r="1" fill="white" fillOpacity="0.09" />
                </pattern>
              </defs>

              {/* Background dot grid */}
              <rect width="480" height="560" fill="url(#dotgrid)" />

              {/* Stars */}
              <circle cx="55"  cy="55"  r="2"   fill="white" fillOpacity="0.65" />
              <circle cx="130" cy="28"  r="1.5" fill="white" fillOpacity="0.45" />
              <circle cx="200" cy="60"  r="1"   fill="white" fillOpacity="0.4"  />
              <circle cx="305" cy="38"  r="2"   fill="white" fillOpacity="0.55" />
              <circle cx="445" cy="55"  r="1.5" fill="white" fillOpacity="0.45" />
              <circle cx="460" cy="105" r="1"   fill="white" fillOpacity="0.35" />
              <circle cx="42"  cy="140" r="1.5" fill="white" fillOpacity="0.35" />

              {/* Crescent moon — upper right */}
              <circle cx="372" cy="90"  r="52" fill="white" fillOpacity="0.88" />
              <circle cx="396" cy="75"  r="44" fill="#1a4731" />

              {/* ── Left minaret ── */}
              {/* Shaft */}
              <rect x="75"  y="148" width="36" height="352" rx="3" fill="white" fillOpacity="0.82" />
              {/* Balcony */}
              <rect x="60"  y="285" width="66" height="10"  rx="2" fill="white" fillOpacity="0.88" />
              {/* Second decorative band */}
              <rect x="68"  y="200" width="50" height="6"   rx="1" fill="white" fillOpacity="0.5"  />
              {/* Pointed cap */}
              <polygon points="93,100 68,152 118,152" fill="white" fillOpacity="0.88" />
              {/* Cap base ring */}
              <rect x="67"  y="149" width="52" height="8"   rx="2" fill="white" fillOpacity="0.6"  />
              {/* Crescent atop left minaret */}
              <circle cx="93"  cy="90"  r="11" fill="white" fillOpacity="0.88" />
              <circle cx="97"  cy="86"  r="9"  fill="#1a4731" />

              {/* ── Right minaret (slightly smaller / further back) ── */}
              <rect x="369" y="168" width="32" height="332" rx="3" fill="white" fillOpacity="0.72" />
              <rect x="356" y="302" width="58" height="9"   rx="2" fill="white" fillOpacity="0.78" />
              <rect x="362" y="220" width="46" height="5"   rx="1" fill="white" fillOpacity="0.45" />
              <polygon points="385,124 362,172 408,172" fill="white" fillOpacity="0.78" />
              <rect x="360" y="169" width="50" height="7"   rx="2" fill="white" fillOpacity="0.52" />
              <circle cx="385" cy="114" r="9"  fill="white" fillOpacity="0.78" />
              <circle cx="389" cy="111" r="7.5" fill="#1a4731" />

              {/* ── Central mosque body ── */}
              {/* Left wing */}
              <rect x="107" y="385" width="70" height="115" rx="2" fill="white" fillOpacity="0.78" />
              <path d="M107,385 Q142,352 177,385" fill="white" fillOpacity="0.78" />
              {/* Left wing arch window */}
              <path d="M122,382 Q142,362 162,382 L162,405 L122,405 Z" fill="#1a4731" fillOpacity="0.45" />

              {/* Right wing */}
              <rect x="303" y="398" width="68" height="102" rx="2" fill="white" fillOpacity="0.72" />
              <path d="M303,398 Q337,368 371,398" fill="white" fillOpacity="0.72" />
              {/* Right wing arch window */}
              <path d="M318,394 Q337,376 356,394 L356,415 L318,415 Z" fill="#1a4731" fillOpacity="0.4" />

              {/* Main body */}
              <rect x="173" y="342" width="134" height="158" rx="2" fill="white" fillOpacity="0.9" />

              {/* Main door arch */}
              <path d="M208,500 Q240,466 272,500 L272,500 L208,500 Z" fill="#1a4731" fillOpacity="0.5" />

              {/* Drum */}
              <rect x="193" y="298" width="94" height="48" rx="2" fill="white" fillOpacity="0.9" />

              {/* Dome — onion / persian shape */}
              <path
                d="M193,298 C191,258 212,205 240,184 C268,205 289,258 287,298 Z"
                fill="white" fillOpacity="0.92"
              />
              {/* Dome inner shading */}
              <path
                d="M210,298 C208,268 222,228 240,212 C258,228 272,268 270,298 Z"
                fill="white" fillOpacity="0.08"
              />

              {/* Dome finial */}
              <rect x="236" y="164" width="8" height="24" rx="2" fill="white" fillOpacity="0.9" />

              {/* Crescent on dome */}
              <circle cx="240" cy="155" r="11" fill="white" fillOpacity="0.9" />
              <circle cx="244" cy="151" r="9"  fill="#1a4731" />

              {/* Side arched pillars / colonnade (decorative) */}
              <rect x="135" y="430" width="18" height="70"  rx="2" fill="white" fillOpacity="0.5" />
              <rect x="160" y="430" width="18" height="70"  rx="2" fill="white" fillOpacity="0.5" />
              <rect x="302" y="430" width="18" height="70"  rx="2" fill="white" fillOpacity="0.45" />
              <rect x="327" y="430" width="18" height="70"  rx="2" fill="white" fillOpacity="0.45" />

              {/* Ground glow */}
              <rect x="0" y="490" width="480" height="70" fill="white" fillOpacity="0.1" />
            </svg>
          </div>

        </div>

        {/* Trust bar — full width below the two columns */}
        <div className="border-t border-gray-100 bg-gray-50/70 py-4">
          <div className="container mx-auto px-4 lg:px-6 flex flex-wrap justify-center gap-6 sm:gap-12">
            {[
              { icon: Building2,   label: "Mosque affiliated" },
              { icon: Star,        label: "Community recommended" },
              { icon: ShieldCheck, label: "Admin approved" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-sm text-gray-500">
                <Icon className="h-4 w-4 text-emerald-600 flex-shrink-0" />
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
