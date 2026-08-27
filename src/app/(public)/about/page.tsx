import Link from "next/link";
import { Search, Phone, Handshake, Star, Users, ArrowRight } from "lucide-react";
import { CommunityCycle } from "@/components/home/community-cycle";
import { MinaretIcon } from "@/components/ui/minaret-logo";

export const metadata = {
  title: "About",
  description:
    "Minaret Network connects GTA mosque communities with trusted, community-affiliated professionals. Learn our mission and how it works.",
};

export default function AboutPage() {
  return (
    <div className="flex flex-col">

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

      {/* ── Mission ──────────────────────────────────────────── */}
      <section className="container mx-auto px-4 lg:px-6 py-20 max-w-2xl text-center">
        <div className="flex justify-center mb-6">
          <MinaretIcon className="h-10 w-10 text-emerald-700 dark:text-emerald-400" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 mb-3">Our mission</p>
        <h1
          className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-5 leading-snug"
          style={{ fontFamily: "var(--font-lora)" }}
        >
          Strengthening the GTA Muslim community — from the inside out.
        </h1>
        <p className="text-base text-gray-500 dark:text-gray-400 leading-relaxed mb-4">
          Finding a professional you can trust shouldn&apos;t mean scrolling through anonymous ratings and hoping for the best.
          In our community, trust has always worked through the mosque, through word of mouth, through knowing someone at Jummah.
        </p>
        <p className="text-base text-gray-500 dark:text-gray-400 leading-relaxed">
          Minaret Network puts that trust online — so the professionals and community members who&apos;d never otherwise find each other, can.
        </p>
      </section>

      {/* ── How It Works ─────────────────────────────────────── */}
      <section className="bg-gray-50 dark:bg-gray-900/50 border-y border-gray-100 dark:border-gray-800 py-20">
        <div className="container mx-auto px-4 lg:px-6">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 mb-2">Simple process</p>
            <h2
              className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white tracking-tight"
              style={{ fontFamily: "var(--font-lora)" }}
            >
              How it works
            </h2>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-lg mx-auto">
            {[
              { icon: <Search className="h-6 w-6 text-emerald-600" />, title: "Search" },
              { icon: <Phone  className="h-6 w-6 text-emerald-600" />, title: "Contact" },
              { icon: <Handshake className="h-6 w-6 text-emerald-600" />, title: "Hire" },
            ].map((item, i, arr) => (
              <div key={item.title} className="flex sm:flex-row flex-col items-center gap-4">
                <div className="flex flex-col items-center gap-2">
                  <div className="h-16 w-16 rounded-2xl bg-white dark:bg-white/5 border border-border shadow-sm flex items-center justify-center">
                    {item.icon}
                  </div>
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300" style={{ fontFamily: "var(--font-lora)" }}>{item.title}</span>
                </div>
                {i < arr.length - 1 && (
                  <>
                    <ArrowRight className="hidden sm:block h-5 w-5 text-emerald-300 flex-shrink-0 mb-5" />
                    <ArrowRight className="block sm:hidden h-5 w-5 text-emerald-300 flex-shrink-0 rotate-90" />
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust Section ────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#0a2e1a] text-white py-20">
        <div className="absolute inset-0 opacity-[0.06] pointer-events-none" aria-hidden="true">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="geo-about" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                <polygon points="30,2 58,16 58,44 30,58 2,44 2,16" fill="none" stroke="white" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#geo-about)"/>
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
              { icon: <Handshake className="h-6 w-6" />, title: "Mosque affiliated",         desc: "Every professional is confirmed by a mosque admin as a member of that congregation." },
              { icon: <Star      className="h-6 w-6" />, title: "Community recommendations", desc: "Recommendations are submitted by community members and reviewed before they go live." },
              { icon: <Users     className="h-6 w-6" />, title: "Admin approved",             desc: "Each listing is reviewed and approved by our administration before appearing in the directory." },
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
      <section className="container mx-auto px-4 lg:px-6 py-20 text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4" style={{ fontFamily: "var(--font-lora)" }}>
            Ready to get started?
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
            Find a mosque-affiliated professional, or join the network and connect with the community.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/professionals"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-800 transition-colors"
            >
              Find a professional <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/professionals/register"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 px-6 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:border-gray-300 transition-colors"
            >
              Join as a professional
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
