export const dynamic = "force-dynamic";

import Link from "next/link";
import { Search, Phone, Handshake, Star, Users, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroSearch } from "@/components/home/hero-search";
import { CategoryGrid } from "@/components/home/category-grid";
import { CommunityCycle } from "@/components/home/community-cycle";
import { DEFAULT_MOSQUE_SLUG } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { FeaturedSection } from "@/components/featured/featured-section";
import { SponsoredLogoCarousel } from "@/components/home/sponsored-logo-carousel";

interface HomePageProps {
  searchParams: Promise<{ featured_city?: string }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const featuredCity = params.featured_city;

  const mosque = await prisma.mosque.findUnique({
    where: { slug: DEFAULT_MOSQUE_SLUG },
    select: { serviceAreas: { orderBy: { name: "asc" }, select: { slug: true, name: true } } },
  });
  const serviceAreas = mosque?.serviceAreas ?? [];

  return (
    <div className="flex flex-col">

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#071a0e] text-white min-h-[600px] flex items-center">

        {/* Mosque photo — very subtle */}
        <div
          className="absolute inset-0 bg-center bg-cover"
          style={{ backgroundImage: "url('/mosque.jpg')" }}
          aria-hidden="true"
        />
        {/* Layered overlays: darken photo, add green tint, vignette */}
        <div className="absolute inset-0 bg-[#071a0e]/80" aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#071a0e] via-[#071a0e]/20 to-[#071a0e]/60" aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#071a0e]/40 via-transparent to-[#071a0e]/40" aria-hidden="true" />

        <div className="relative w-full container mx-auto px-4 lg:px-6 py-24 md:py-32">
          <div className="max-w-3xl mx-auto text-center">

            <div className="inline-flex items-center gap-2 bg-white/8 backdrop-blur-sm border border-white/12 rounded-full px-4 py-1.5 text-sm text-emerald-300/90 mb-8">
              A GTA Masjid Professional Directory
            </div>

            <h1
              className="text-5xl md:text-6xl lg:text-[4.5rem] leading-[1.1] mb-6 text-white"
              style={{ fontFamily: "var(--font-playfair)", fontWeight: 700 }}
            >
              Find professionals from your
              <span className="block text-emerald-400 italic"> mosque community.</span>
            </h1>

            <p className="text-lg md:text-xl text-white/55 max-w-xl mx-auto mb-10 leading-relaxed font-light" style={{ fontFamily: "var(--font-dm-sans)" }}>
              Minaret Network connects you with doctors, realtors, IT professionals, plumbers, HVAC techs, notaries, handymen, and more — skilled trades and professionals, all affiliated with masjids across the GTA.
            </p>

            <div className="flex justify-center mb-8">
              <HeroSearch serviceAreas={serviceAreas} />
            </div>

            <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm text-white/40 mb-5" style={{ fontFamily: "var(--font-dm-sans)" }}>
              {[
                "Mosque affiliated",
                "Community recommendations",
                "25+ categories",
                "Direct WhatsApp contact",
              ].map((t) => (
                <span key={t} className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500/80 flex-shrink-0" />
                  {t}
                </span>
              ))}
            </div>

            <p className="text-xs text-white/30 max-w-md mx-auto leading-relaxed" style={{ fontFamily: "var(--font-dm-sans)" }}>
              Mosque affiliation is confirmed by admins. We recommend doing your own due diligence before hiring.
            </p>
          </div>
        </div>

        {/* Bottom fade into page bg */}
        <div className="absolute bottom-0 inset-x-0 h-20 bg-gradient-to-t from-[oklch(0.985_0.004_90)] to-transparent dark:from-[oklch(0.12_0.01_260)]" aria-hidden="true" />
      </section>

      {/* ── Sponsor Logo Carousel ───────────────────────────── */}
      <SponsoredLogoCarousel />

      {/* ── Featured Businesses ──────────────────────────────── */}
      <FeaturedSection city={featuredCity} />

      {/* ── Quranic Verse ────────────────────────────────────── */}
      <section className="bg-white dark:bg-gray-950 border-b border-gray-100 dark:border-gray-900 py-16">
        <div className="container mx-auto px-4 lg:px-6 max-w-2xl text-center">
          <p
            className="text-3xl md:text-4xl text-emerald-700 dark:text-emerald-400 leading-loose mb-4 tracking-wide"
            style={{ fontFamily: "var(--font-playfair)", direction: "rtl" }}
          >
            لِتَعَارَفُوا
          </p>
          <p
            className="text-lg md:text-xl text-gray-600 dark:text-gray-300 leading-loose mb-6"
            style={{ fontFamily: "var(--font-playfair)", direction: "rtl" }}
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

      {/* ── Categories ───────────────────────────────────────── */}
      <section className="container mx-auto px-4 lg:px-6 py-20">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 mb-2">Browse by profession</p>
            <h2
              className="text-3xl md:text-4xl font-display font-700 text-gray-900 dark:text-white tracking-tight"
              style={{ fontFamily: "var(--font-playfair)" }}
            >
              What do you need help with?
            </h2>
          </div>
          <Link href="/categories" className="hidden sm:flex items-center gap-1 text-sm font-medium text-emerald-700 hover:text-emerald-800 dark:text-emerald-400">
            All categories <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <CategoryGrid />
      </section>

      {/* ── How It Works ─────────────────────────────────────── */}
      <section className="container mx-auto px-4 lg:px-6 py-20">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 mb-2">Simple process</p>
          <h2
            className="text-3xl md:text-4xl font-display font-700 text-gray-900 dark:text-white tracking-tight"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            How it works
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto relative">
          {/* Connector line */}
          <div className="hidden md:block absolute top-10 left-[calc(16.67%+2rem)] right-[calc(16.67%+2rem)] h-px bg-gradient-to-r from-emerald-200 via-emerald-300 to-emerald-200" aria-hidden="true" />

          {[
            {
              icon: <Search className="h-6 w-6 text-emerald-600" />,
              step: "1",
              title: "Search",
              description: "Browse by profession or service area. Filter by language, location, and more.",
            },
            {
              icon: <Phone className="h-6 w-6 text-emerald-600" />,
              step: "2",
              title: "Contact",
              description: "View their full profile, read community recommendations, then reach out directly.",
            },
            {
              icon: <Handshake className="h-6 w-6 text-emerald-600" />,
              step: "3",
              title: "Hire",
              description: "Work with confidence. Leave a recommendation to help the community.",
            },
          ].map((item) => (
            <div key={item.step} className="flex flex-col items-center text-center">
              <div className="relative mb-6">
                <div className="h-20 w-20 rounded-2xl bg-white dark:bg-white/5 border border-border shadow-sm flex items-center justify-center">
                  {item.icon}
                </div>
                <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-emerald-600 text-white text-xs font-bold font-display flex items-center justify-center shadow-sm">
                  {item.step}
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2" style={{ fontFamily: "var(--font-playfair)" }}>{item.title}</h3>
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
            <h2 className="text-3xl md:text-4xl font-display font-700 tracking-tight" style={{ fontFamily: "var(--font-playfair)" }}>
              Why the community trusts us
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-3xl mx-auto">
            {[
              {
                icon: <Handshake className="h-6 w-6" />,
                title: "Mosque affiliated",
                desc: "Every professional is confirmed by a mosque admin as a member of that congregation.",
              },
              {
                icon: <Star className="h-6 w-6" />,
                title: "Community recommendations",
                desc: "Recommendations are submitted by community members and reviewed before they go live.",
              },
              {
                icon: <Users className="h-6 w-6" />,
                title: "Admin approved",
                desc: "Each listing is reviewed and approved by our administration before appearing in the directory.",
              },
            ].map((item) => (
              <div key={item.title} className="text-center">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-white/8 border border-white/10 text-emerald-400 mb-5 mx-auto">
                  {item.icon}
                </div>
                <h3 className="font-semibold text-white mb-2" style={{ fontFamily: "var(--font-playfair)" }}>{item.title}</h3>
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
          <h2
            className="text-3xl md:text-4xl font-display font-700 text-gray-900 dark:text-white tracking-tight mb-4"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
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
