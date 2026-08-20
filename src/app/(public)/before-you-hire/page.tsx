import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Before You Hire",
  description:
    "What you should know about how Minaret Network works before reaching out to a professional.",
};

export default function BeforeYouHirePage() {
  return (
    <main className="bg-[#fbfaf6] py-12 sm:py-16">
      <article className="mx-auto max-w-3xl px-4 sm:px-6">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">Platform transparency</p>
        <h1 className="mt-3 font-serif text-4xl font-semibold text-slate-950">Before You Hire</h1>

        <div className="mt-10 space-y-6 text-base leading-7 text-slate-700">
          <p>
            Before you reach out to a professional through Minaret Network, here&apos;s what you should
            know about how this platform works.
          </p>

          <p>
            <strong className="font-semibold text-slate-900">We don&apos;t verify what professionals tell us.</strong>{" "}
            Credentials, licences, years of experience, business details â€” all of it is provided by the
            professional, and we don&apos;t independently check it. If it matters to you â€” and for anything
            requiring a licence, it should â€” verify it yourself before hiring someone.
          </p>

          <p>
            <strong className="font-semibold text-slate-900">Mosque affiliation works the same way.</strong>{" "}
            When a professional lists a mosque they&apos;re affiliated with, that&apos;s their own statement, not
            something we&apos;ve confirmed, and not something the mosque has endorsed. A professional appearing
            on Minaret Network with a mosque&apos;s name attached doesn&apos;t mean that mosque vouches for them.
          </p>

          <p>
            <strong className="font-semibold text-slate-900">Being listed isn&apos;t an endorsement from us, either.</strong>{" "}
            We&apos;re a platform, not a review committee. We don&apos;t vet professionals for quality, and
            appearing here â€” paid placement or not â€” isn&apos;t Minaret Network telling you someone is good
            at their job.
          </p>

          <p>
            <strong className="font-semibold text-slate-900">Sponsored and Featured listings are paid placement, clearly labelled.</strong>{" "}
            A professional who pays for visibility gets more of it. That&apos;s advertising, not our opinion.
          </p>

          <p>
            <strong className="font-semibold text-slate-900">Our AI assistant helps you find relevant listings faster</strong>{" "}
            â€” treat its suggestions as a starting point, not a recommendation. It can be incomplete or get
            things wrong, the same as any search tool.
          </p>

          <p>
            <strong className="font-semibold text-slate-900">You&apos;re responsible for your own due diligence.</strong>{" "}
            Ask questions, check references, verify licensing where it matters, and use the same judgment
            you&apos;d use with anyone you didn&apos;t already know personally.
          </p>

          <p>
            If something on the platform seems false, misleading, or wrong, tell us â€” see our{" "}
            <Link href="/terms" className="text-emerald-700 underline underline-offset-2 hover:text-emerald-900">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-emerald-700 underline underline-offset-2 hover:text-emerald-900">
              Privacy Policy
            </Link>{" "}
            for how.
          </p>
        </div>
      </article>
    </main>
  );
}
