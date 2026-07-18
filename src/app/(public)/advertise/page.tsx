import Link from "next/link";
import { CheckCircle, Sparkles, MapPin, Star, ArrowRight, Clock, Shield, TrendingUp, Wrench } from "lucide-react";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Advertise | Minaret Network",
  description: "Grow your business by reaching trusted mosque community members across the GTA.",
};

async function getPrices() {
  const [sponsored, featured] = await Promise.all([
    prisma.sponsoredPricingTier.findFirst({
      where: { categoryId: null, serviceAreaId: null, isActive: true },
      select: { priceMonthly: true },
    }),
    prisma.featuredPricingTier.findFirst({
      where: { city: null, isActive: true },
      select: { priceMonthly: true },
    }),
  ]);
  return {
    sponsored: sponsored ? Number(sponsored.priceMonthly) : 49,
    featured: featured ? Number(featured.priceMonthly) : 99,
  };
}

const BENEFITS = [
  { icon: <TrendingUp className="h-5 w-5" />, label: "Priority placement", desc: "Appear above all organic results for your category and service area" },
  { icon: <Shield className="h-5 w-5" />, label: "Built-in trust", desc: "Community members already trust Minaret Network — your listing inherits that credibility" },
  { icon: <MapPin className="h-5 w-5" />, label: "Hyper-local reach", desc: "Shown only to people searching in your service area, not wasted impressions" },
  { icon: <Star className="h-5 w-5" />, label: "Profile visibility", desc: "See how many community members viewed your profile and clicked to contact you" },
];

const SHARED_STEPS = [
  { n: "1", title: "Register your business", desc: "Create a free professional profile. Takes about 5 minutes." },
  { n: "2", title: "Get verified", desc: "An admin reviews your profile, typically within 24 hours." },
];

const SPONSORED_STEP = { title: "Apply for a Sponsored slot", desc: "Pick your category and service area. Once approved, your listing pins to the top of relevant searches. Only 2 slots per category — first come, first served." };
const FEATURED_STEP = { title: "Apply for a Featured spot", desc: "Choose your city. Once approved, your business card appears in the Featured section on the homepage. Only 6 businesses per city at any time." };

export default async function AdvertisePage() {
  const { sponsored: price, featured: featuredPrice } = await getPrices();

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">

      {/* Hero */}
      <section className="bg-gradient-to-b from-emerald-900 to-emerald-800 text-white py-12 md:py-20 px-4">
        <div className="container mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 text-emerald-300 text-sm font-medium mb-6 bg-emerald-800/50 border border-emerald-700 px-4 py-1.5 rounded-full">
            <Sparkles className="h-4 w-4" />
            Advertise with Us — Minaret Network
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight mb-6" style={{ fontFamily: "var(--font-playfair)" }}>
            Grow Your Business Within a Trusted Community
          </h1>
          <p className="text-emerald-100 text-lg leading-relaxed max-w-xl mx-auto mb-8">
            Reach mosque members across the GTA who are actively looking for trusted professionals — plumbers, realtors, lawyers, handymen, and more.
          </p>
          <Link
            href="/professionals/register"
            className="inline-flex items-center gap-2 bg-white text-emerald-900 font-semibold px-6 py-3.5 rounded-xl hover:bg-emerald-50 transition-colors text-sm shadow-lg"
          >
            Get Started — It&apos;s Free to Register
            <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="text-emerald-400 text-xs mt-3">Already registered? <Link href="/dashboard/promote" className="underline hover:text-emerald-200">Go to your dashboard →</Link></p>
        </div>
      </section>

      {/* Sponsored card mockup */}
      <section className="py-14 px-4 bg-gray-50 dark:bg-gray-900/50">
        <div className="container mx-auto max-w-3xl">
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-gray-400 mb-6">What your listing looks like</p>
          <div className="max-w-sm mx-auto">
            <div className="relative bg-white dark:bg-gray-900 border border-violet-200 dark:border-violet-800/50 ring-1 ring-violet-100 dark:ring-violet-900/30 rounded-2xl p-5 shadow-md">
              <div className="absolute top-3 right-3">
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-violet-600 bg-violet-50 border border-violet-200 rounded-full px-2 py-0.5">
                  <Sparkles className="h-2.5 w-2.5" />
                  Sponsored
                </span>
              </div>
              <div className="flex items-start gap-3.5 mb-3">
                <div className="h-14 w-14 flex-shrink-0 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white font-bold text-lg">
                  A
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-[15px]">Ahmed Plumbing & Heating</p>
                  <p className="text-xs text-gray-400 mt-0.5">Ahmed Al-Rashid</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Wrench className="h-3 w-3 text-emerald-700" />
                    <span className="text-xs font-medium text-emerald-700">Plumber</span>
                    <span className="text-gray-200">·</span>
                    <span className="text-xs text-gray-400">12y exp</span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-500 line-clamp-2 mb-3">Licensed plumber serving the GTA. Residential and commercial work. Emergency calls welcome.</p>
              <div className="flex items-center gap-1.5 mb-4">
                <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 font-medium">
                  <CheckCircle className="h-2.5 w-2.5" /> Affiliated · Al-Falah Mosque
                </span>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <MapPin className="h-3 w-3" /> Toronto, Mississauga
                </span>
                <span className="h-7 px-3 bg-gray-900 text-white text-xs font-medium rounded-lg flex items-center gap-1">
                  View <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </div>
            <p className="text-center text-xs text-gray-400 mt-3">Your listing, pinned at the top of relevant searches</p>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-10" style={{ fontFamily: "var(--font-playfair)" }}>
            Why advertise on Minaret Network?
          </h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {BENEFITS.map((b) => (
              <div key={b.label} className="flex gap-4">
                <div className="h-10 w-10 flex-shrink-0 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  {b.icon}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">{b.label}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-gray-900/50">
        <div className="container mx-auto max-w-2xl">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-8" style={{ fontFamily: "var(--font-playfair)" }}>
            Simple, flat pricing
          </h2>
          <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">

          {/* Featured Business card */}
          <div className="bg-white dark:bg-gray-900 border-2 border-amber-300 dark:border-amber-700 rounded-2xl p-6 sm:p-8 shadow-sm text-center relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow">Most Visible</span>
            </div>
            <div className="inline-flex items-center gap-1.5 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 px-3 py-1 rounded-full text-xs font-semibold mb-5">
              <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
              Featured Business
            </div>
            <div className="mb-1">
              <span className="text-5xl font-bold text-gray-900 dark:text-white">${featuredPrice}</span>
              <span className="text-gray-400 text-sm ml-1">CAD / month</span>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Homepage placement · Max 6 per city</p>
            <ul className="text-left space-y-2.5 mb-8">
              {[
                "Homepage \"Featured Businesses\" section",
                "City-targeted — shown to local members",
                "Featured badge on your business card",
                "Impression & click analytics",
                "Max 6 businesses per city",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                  <CheckCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
            <Link href="/professionals/register"
              className="block w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3 rounded-xl transition-colors text-sm text-center">
              Get Featured
            </Link>
          </div>

          {/* Sponsored Listing card */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 sm:p-8 shadow-sm text-center">
            <div className="inline-flex items-center gap-1.5 text-violet-700 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800/40 px-3 py-1 rounded-full text-xs font-semibold mb-5">
              <Sparkles className="h-3.5 w-3.5" />
              Sponsored Listing
            </div>
            <div className="mb-1">
              <span className="text-5xl font-bold text-gray-900 dark:text-white">${price}</span>
              <span className="text-gray-400 text-sm ml-1">CAD / month</span>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Cancel anytime. No long-term contract.</p>
            <ul className="text-left space-y-2.5 mb-8">
              {[
                "Priority placement in search results",
                "Sponsored badge on your profile card",
                "Shown only in your category & service area",
                "Profile views & contact click tracking",
                "Admin-verified for trust & quality",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                  <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/professionals/register"
              className="block w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition-colors text-sm text-center"
            >
              Get Started — Register Free
            </Link>
            <p className="text-xs text-gray-400 mt-3">Listing fee applies after your profile is approved</p>
          </div>

          </div>{/* /grid */}
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-2" style={{ fontFamily: "var(--font-playfair)" }}>
            How it works
          </h2>
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-10">Two steps are the same for both products. Then choose your path.</p>

          {/* Shared steps */}
          <div className="flex flex-col sm:flex-row gap-0 sm:gap-0 justify-center mb-6">
            {SHARED_STEPS.map((s, i) => (
              <div key={s.n} className="flex sm:flex-col items-start sm:items-center gap-4 sm:gap-2 flex-1 relative">
                {/* connector line between steps */}
                {i < SHARED_STEPS.length - 1 && (
                  <div className="hidden sm:block absolute top-5 left-[calc(50%+20px)] right-[calc(-50%+20px)] h-px bg-gray-200 dark:bg-gray-800" />
                )}
                <div className="h-10 w-10 flex-shrink-0 rounded-full bg-emerald-600 text-white font-bold text-sm flex items-center justify-center z-10">
                  {s.n}
                </div>
                <div className="sm:text-center sm:px-4 pb-4 sm:pb-0">
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">{s.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Then choose */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest flex-shrink-0">Then choose your path</span>
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {/* Sponsored path */}
            <div className="rounded-xl border border-violet-200 dark:border-violet-800/50 bg-violet-50/50 dark:bg-violet-900/10 p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-8 w-8 rounded-full bg-violet-600 text-white font-bold text-sm flex items-center justify-center flex-shrink-0">3</div>
                <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-violet-700 dark:text-violet-400 bg-violet-100 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-800 px-2 py-0.5 rounded-full">
                  <Sparkles className="h-3 w-3" /> Sponsored Listing
                </div>
              </div>
              <p className="font-semibold text-gray-900 dark:text-white text-sm mb-1">{SPONSORED_STEP.title}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{SPONSORED_STEP.desc}</p>
            </div>

            {/* Featured path */}
            <div className="rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-900/10 p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-8 w-8 rounded-full bg-amber-500 text-white font-bold text-sm flex items-center justify-center flex-shrink-0">3</div>
                <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-full">
                  <Star className="h-3 w-3 fill-amber-500" /> Featured Business
                </div>
              </div>
              <p className="font-semibold text-gray-900 dark:text-white text-sm mb-1">{FEATURED_STEP.title}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{FEATURED_STEP.desc}</p>
            </div>
          </div>

          <div className="mt-6 flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl">
            <Clock className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Profile reviews typically take <strong className="text-gray-700 dark:text-gray-300">24–48 hours</strong>. Both products are reviewed and approved by our admin team before going live.
            </p>
          </div>
        </div>
      </section>

      {/* CTA footer */}
      <section className="py-16 px-4 bg-emerald-900 text-white text-center">
        <div className="container mx-auto max-w-xl">
          <h2 className="text-2xl font-bold mb-3" style={{ fontFamily: "var(--font-playfair)" }}>
            Ready to grow your business?
          </h2>
          <p className="text-emerald-200 text-sm mb-7">
            Join the professionals already building their reputation within the GTA mosque community.
          </p>
          <Link
            href="/professionals/register"
            className="inline-flex items-center gap-2 bg-white text-emerald-900 font-semibold px-6 py-3.5 rounded-xl hover:bg-emerald-50 transition-colors text-sm shadow"
          >
            Register Your Business — Free
            <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="text-emerald-500 text-xs mt-4">
            Already have a profile?{" "}
            <Link href="/dashboard/promote" className="underline hover:text-emerald-300">
              Apply for a sponsored slot →
            </Link>
          </p>
        </div>
      </section>

    </div>
  );
}
