import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { MinaretIcon } from "@/components/ui/minaret-logo";

export const metadata = {
  title: "Our Mission",
  description:
    "Minaret Network exists to strengthen the Muslim community of the Greater Toronto Area from the inside out.",
};

export default function MissionPage() {
  return (
    <main className="bg-white dark:bg-gray-950">

      {/* â”€â”€ Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="bg-[#0a2e1a]">
        <div className="container mx-auto max-w-3xl px-6 py-16 sm:py-20">
          <Link
            href="/"
            className="mb-10 inline-flex items-center gap-2 text-sm font-medium text-white/40 transition hover:text-emerald-400"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>

          <div className="flex items-start gap-5">
            <MinaretIcon className="h-14 w-auto flex-shrink-0 text-emerald-500 mt-1" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-500 mb-3">
                Minaret Network
              </p>
              <h1
                className="text-4xl sm:text-5xl font-bold text-white leading-[1.1]"
                style={{ fontFamily: "var(--font-lora)" }}
              >
                Our Mission
              </h1>
              <p className="mt-4 text-lg text-white/60 leading-relaxed max-w-xl">
                Strengthening the Muslim community of the Greater Toronto Area â€” from the inside out.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* â”€â”€ Body â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="container mx-auto max-w-2xl px-6 py-16 sm:py-20 space-y-16">

        <Section
          heading="The problem we saw"
          accent="amber"
        >
          <p>
            Finding a professional you can trust shouldn&apos;t mean scrolling through anonymous star
            ratings and hoping for the best. In our community, trust has always worked differently â€”
            through the mosque, through word of mouth, through knowing someone&apos;s brother or seeing
            them at Jummah.
          </p>
          <p>
            That kind of trust doesn&apos;t scale past your own circle, and a lot of good professionals
            in our community stay invisible outside it, while a lot of community members end up hiring
            strangers because they didn&apos;t know where else to look.
          </p>
        </Section>

        <Section heading="What we&apos;re building" accent="emerald">
          <p>
            Minaret Network is a directory built for that gap: a way for community members to find
            skilled professionals and tradespeople who share this community, and a way for those
            professionals â€” from lawyers to plumbers to tutors â€” to find real work within it. Every
            listing here is someone whose reputation is tied to the same community you&apos;re part of,
            not a stranger from an algorithm.
          </p>
          <p>
            We&apos;re not a verification service and we don&apos;t pretend to be â€” professionals tell us who
            they are and where they&apos;re affiliated, and we ask our community to do what communities
            have always done: check, ask around, and use their judgment. What we add is reach â€”
            connecting people who&apos;d never otherwise have found each other.
          </p>
        </Section>

        <Section heading="Why it matters beyond convenience" accent="emerald">
          <p>
            Every dollar a community member spends with a community professional is a dollar that
            circulates inside the community instead of leaving it. That&apos;s the quiet economic case
            for what we&apos;re building: real work, for real people, without leaving the community
            to find it.
          </p>
        </Section>

        <Section heading="Where we&apos;re headed" accent="emerald">
          <p>
            We&apos;re early. We&apos;re building this one relationship at a time, starting with the
            professionals and community members already doing good work across the GTA â€” and we
            intend to keep building it the same way: deliberately, and grounded in what this
            community actually needs.
          </p>
        </Section>

        {/* â”€â”€ CTA â”€â”€ */}
        <div className="border-t border-gray-100 dark:border-gray-800 pt-12 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Link
            href="/professionals"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
          >
            Browse professionals
          </Link>
          <Link
            href="/professionals/register"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-6 py-3 text-sm font-semibold text-gray-700 transition hover:border-emerald-300 hover:text-emerald-700 dark:border-gray-700 dark:text-gray-300"
          >
            List your practice
          </Link>
        </div>

      </div>
    </main>
  );
}

function Section({
  heading,
  accent,
  children,
}: {
  heading: string;
  accent: "emerald" | "amber";
  children: React.ReactNode;
}) {
  const bar =
    accent === "amber"
      ? "bg-amber-400"
      : "bg-emerald-500";

  return (
    <section>
      <div className="flex items-start gap-4 mb-5">
        <div className={`mt-1.5 h-5 w-1 flex-shrink-0 rounded-full ${bar}`} />
        <h2
          className="text-2xl font-bold text-gray-900 dark:text-white leading-snug"
          style={{ fontFamily: "var(--font-lora)" }}
          dangerouslySetInnerHTML={{ __html: heading }}
        />
      </div>
      <div className="pl-5 space-y-4 text-base leading-relaxed text-gray-600 dark:text-gray-400">
        {children}
      </div>
    </section>
  );
}
