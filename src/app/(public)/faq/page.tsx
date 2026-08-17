import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "FAQ | Minaret Network",
  description: "Answers to the most common questions about Minaret Network — finding professionals, listing your business, community events, and more.",
};

const FAQS: { section: string; items: { q: string; a: React.ReactNode }[] }[] = [
  {
    section: "Finding professionals",
    items: [
      {
        q: 'What does "mosque-affiliated" mean? Are these professionals verified?',
        a: (
          <>
            Mosque-affiliated means each professional is a confirmed member of a participating mosque congregation — they attend that masjid and are known to that community. It does <strong>not</strong> mean their professional credentials, licences, or qualifications have been independently verified by Minaret Network. We strongly recommend reading our{" "}
            <Link href="/before-you-hire" className="text-emerald-700 dark:text-emerald-400 underline underline-offset-2 hover:no-underline">
              Before You Hire
            </Link>{" "}
            guide before engaging any professional.
          </>
        ),
      },
      {
        q: "How do I find a professional in my area?",
        a: (
          <>
            Use the search bar on the{" "}
            <Link href="/" className="text-emerald-700 dark:text-emerald-400 underline underline-offset-2 hover:no-underline">
              home page
            </Link>{" "}
            or{" "}
            <Link href="/professionals" className="text-emerald-700 dark:text-emerald-400 underline underline-offset-2 hover:no-underline">
              browse all professionals
            </Link>. You can filter by category, city, and service area. If you can't find what you need, submit a{" "}
            <Link href="/request" className="text-emerald-700 dark:text-emerald-400 underline underline-offset-2 hover:no-underline">
              service request
            </Link>{" "}
            and matching professionals will reach out to you.
          </>
        ),
      },
      {
        q: "Is it free to search and contact professionals?",
        a: "Yes — searching the directory and contacting professionals is completely free for community members. There is no subscription or fee to use Minaret Network as a person looking for help.",
      },
      {
        q: "What if I have a bad experience with a professional?",
        a: (
          <>
            You can report a listing directly from the professional's profile page using the Report button. Our admin team reviews all reports. For urgent concerns, email us at{" "}
            <a href="mailto:salam@minaretnetwork.ca" className="text-emerald-700 dark:text-emerald-400 underline underline-offset-2 hover:no-underline">
              salam@minaretnetwork.ca
            </a>. Note that Minaret Network is a directory — we facilitate connections but are not party to any agreement between you and a professional.
          </>
        ),
      },
      {
        q: "How do I submit a service request?",
        a: (
          <>
            Go to{" "}
            <Link href="/request" className="text-emerald-700 dark:text-emerald-400 underline underline-offset-2 hover:no-underline">
              Service Request
            </Link>, describe what you need, and select a category. Approved professionals in that category will be notified and can respond to you directly through the platform.
          </>
        ),
      },
    ],
  },
  {
    section: "Getting listed as a professional",
    items: [
      {
        q: "How do I get listed on Minaret Network?",
        a: (
          <>
            <Link href="/professionals/register" className="text-emerald-700 dark:text-emerald-400 underline underline-offset-2 hover:no-underline">
              Register as a professional
            </Link>, complete your profile, and select the mosque you are affiliated with. Your application goes to our admin team for review. Once approved, your listing goes live in the directory.
          </>
        ),
      },
      {
        q: "What does it cost to be listed?",
        a: "Creating a basic professional listing is free. There is no monthly fee to appear in the directory. Optional Sponsored Listings and Featured Business placements are available for additional visibility — see below.",
      },
      {
        q: "How long does approval take?",
        a: "Most applications are reviewed within 1–3 business days. You will receive an email notification when your listing is approved or if we need more information.",
      },
      {
        q: "Can I be listed in multiple categories or service areas?",
        a: "Each professional profile is linked to one primary category, but your service areas can cover multiple cities across the GTA. If you practise in more than one field, contact us at salam@minaretnetwork.ca and we can discuss your situation.",
      },
      {
        q: "What is a Sponsored Listing, and what is a Featured Business?",
        a: (
          <ul className="space-y-2">
            <li>
              <strong>Sponsored Listing ($19.99/month after Oct 31, 2026):</strong> Your profile is pinned to the top of search results for your category across your entire GTA region — shown first whenever someone in that region searches for your profession.
            </li>
            <li>
              <strong>Featured Business ($29.99/month after Oct 31, 2026):</strong> Your business card is displayed prominently on the Minaret Network homepage, visible to every visitor across the GTA.
            </li>
            <li>
              <strong>Free until Oct 31, 2026:</strong> Both placements are completely free during our launch period — one placement per business for the duration of the offer.
            </li>
          </ul>
        ),
      },
      {
        q: "How do Featured Business slots work? How many are there?",
        a: "Featured Business is GTA-wide. There are 6 slots in total, shared across all businesses regardless of city. Every visitor to the Minaret Network homepage sees all active Featured Business cards — there is no city or region filter. If all 6 slots are taken, you can join the waitlist and will be notified when a slot becomes available.",
      },
      {
        q: "How do Sponsored Listing slots work? What are the regions?",
        a: (
          <>
            <p className="mb-2">Sponsored Listings are capped at <strong>3 businesses per category per region</strong>. The GTA is divided into 6 regions:</p>
            <ul className="space-y-1 list-disc list-inside mb-2">
              <li><strong>York North</strong> — Newmarket, Aurora, Bradford, King City, Georgina, East Gwillimbury</li>
              <li><strong>York South</strong> — Richmond Hill, Vaughan, Markham, Stouffville</li>
              <li><strong>Toronto</strong> — Downtown, North York, Scarborough, Etobicoke, East York</li>
              <li><strong>Peel</strong> — Mississauga, Brampton, Caledon</li>
              <li><strong>Durham</strong> — Pickering, Ajax, Whitby, Oshawa, Uxbridge</li>
              <li><strong>Halton</strong> — Oakville, Burlington, Milton</li>
            </ul>
            <p>When you apply, your region is determined by the service area you select. Your sponsored listing then appears at the top of all searches in that category across your entire region — not just one city.</p>
          </>
        ),
      },
      {
        q: "How does the free launch offer work exactly?",
        a: "During the free period (until October 31, 2026), each business may claim one Featured Business placement and one Sponsored Listing at no charge. Once your listing has been approved and activated, you cannot reapply for a second placement of the same type until November 1, 2026 — even if your first listing expires before then.",
      },
      {
        q: "How long does a Sponsored Listing or Featured Business placement last?",
        a: "Each placement runs for 30 days from the date it is approved by our admin team (rolling period, not calendar month). After 30 days it expires and you may reapply (subject to the free-period rules above).",
      },
      {
        q: "What happens if a slot is full? Can I join a waitlist?",
        a: "Yes. If all slots are taken — 6 GTA-wide for Featured Business, or 3 per category per region for Sponsored Listings — you will be automatically added to the waitlist when you apply. We will notify you as soon as a slot opens up. Your position in the queue is first-come, first-served.",
      },
    ],
  },
  {
    section: "Community events",
    items: [
      {
        q: "How do I post a community event?",
        a: (
          <>
            Go to{" "}
            <Link href="/events/submit" className="text-emerald-700 dark:text-emerald-400 underline underline-offset-2 hover:no-underline">
              Post an Event
            </Link>, fill in the details, upload an image if you have one, and submit. All events are reviewed by our admin team before going live. Paid events go through a Stripe checkout first, then await admin approval.
          </>
        ),
      },
      {
        q: "How long does my event listing stay up?",
        a: "Event listings run for 30 days from the date they are approved, or until the event date — whichever comes first. This means if your event is 10 days away when approved, the listing will be removed on the event date.",
      },
      {
        q: "My event is mosque-organized — is it really free?",
        a: 'Yes. Events organized by a mosque are listed at no charge. When submitting, check "This event is organized by a mosque", enter the mosque name, and confirm you are authorized to post on their behalf. This is self-reported — misrepresentation may result in removal.',
      },
      {
        q: "What is the difference between a Standard and a Featured event listing?",
        a: (
          <ul className="space-y-2">
            <li><strong>Standard ($24.99 CAD):</strong> Your event appears in the community events grid alongside all other active events.</li>
            <li><strong>Featured ($49.99 CAD):</strong> Your event is highlighted at the top of the events page with a Featured badge — maximum visibility for high-attendance events like fundraisers, bazaars, and large community dinners.</li>
          </ul>
        ),
      },
    ],
  },
  {
    section: "Privacy, safety & contact",
    items: [
      {
        q: "Is my personal information safe?",
        a: "Yes. We use Supabase (built on AWS) for secure authentication and data storage, and Stripe for all payment processing — Minaret Network never stores your card details. We do not sell or share your personal information with third parties. See our full Privacy Policy for details.",
      },
      {
        q: "How do I report a problem with a listing?",
        a: "Each professional profile and event listing has a Report button. Submitting a report sends it directly to our admin team for review. We aim to respond to all reports within 2 business days.",
      },
      {
        q: "How do I contact Minaret Network?",
        a: (
          <>
            Email us at{" "}
            <a href="mailto:salam@minaretnetwork.ca" className="text-emerald-700 dark:text-emerald-400 underline underline-offset-2 hover:no-underline">
              salam@minaretnetwork.ca
            </a>. We aim to respond within 1–2 business days.
          </>
        ),
      },
    ],
  },
];

export default function FAQPage() {
  return (
    <main className="min-h-[70vh] bg-[#fbfaf6] dark:bg-gray-950">
      <div className="container mx-auto max-w-3xl px-4 py-14">

        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-emerald-700 dark:text-gray-400 dark:hover:text-emerald-400 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <h1
          className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3"
          style={{ fontFamily: "var(--font-lora)" }}
        >
          Frequently Asked Questions
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-12 leading-relaxed">
          Can't find an answer here? Email us at{" "}
          <a href="mailto:salam@minaretnetwork.ca" className="text-emerald-700 dark:text-emerald-400 underline underline-offset-2 hover:no-underline">
            salam@minaretnetwork.ca
          </a>.
        </p>

        <div className="space-y-14">
          {FAQS.map((section) => (
            <section key={section.section}>
              <h2
                className="text-xs font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-500 mb-6"
              >
                {section.section}
              </h2>
              <div className="space-y-0 divide-y divide-gray-200 dark:divide-gray-800 border-t border-b border-gray-200 dark:border-gray-800">
                {section.items.map((item) => (
                  <details
                    key={item.q}
                    className="group py-5"
                  >
                    <summary className="flex items-start justify-between gap-4 cursor-pointer list-none">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white leading-snug">
                        {item.q}
                      </span>
                      <span className="mt-0.5 flex-shrink-0 text-gray-400 group-open:rotate-45 transition-transform duration-200 text-lg leading-none select-none">
                        +
                      </span>
                    </summary>
                    <div className="mt-3 text-sm text-gray-600 dark:text-gray-400 leading-relaxed pr-8">
                      {item.a}
                    </div>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 px-6 py-8 text-center">
          <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Still have a question?</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Our team usually responds within 1–2 business days.</p>
          <a
            href="mailto:salam@minaretnetwork.ca"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 transition-colors"
          >
            salam@minaretnetwork.ca
          </a>
        </div>

      </div>
    </main>
  );
}
