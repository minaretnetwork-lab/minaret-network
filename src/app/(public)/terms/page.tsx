import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms governing use of Minaret Network.",
};

function Section({ id, number, title, children }: { id: string; number: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-6">
      <h2 className="font-serif text-xl font-semibold text-slate-950 dark:text-white">
        <span className="text-emerald-700 dark:text-emerald-500 mr-2">{number}.</span>
        {title}
      </h2>
      <div className="mt-3 space-y-3 text-sm leading-7 text-slate-700 dark:text-slate-300">
        {children}
      </div>
    </section>
  );
}

function Warning({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/20 px-4 py-3 text-sm leading-6 text-amber-900 dark:text-amber-200">
      <span className="font-semibold">⚠ Note: </span>{children}
    </div>
  );
}

function Ul({ children }: { children: React.ReactNode }) {
  return <ul className="list-disc list-inside space-y-1 pl-2">{children}</ul>;
}

const REGIONS = [
  { name: "York North",  cities: "Newmarket, Aurora, Bradford, King City, Georgina, East Gwillimbury, Keswick, Sutton" },
  { name: "York South",  cities: "Richmond Hill, Vaughan, Markham, Stouffville" },
  { name: "Toronto",     cities: "Downtown, North York, Scarborough, Etobicoke, East York" },
  { name: "Peel",        cities: "Mississauga, Brampton, Caledon" },
  { name: "Durham",      cities: "Pickering, Ajax, Whitby, Oshawa, Uxbridge" },
  { name: "Halton",      cities: "Oakville, Burlington, Milton" },
  { name: "Beyond GTA",  cities: "Hamilton, Barrie, and surrounding areas" },
];

export default function TermsPage() {
  return (
    <main className="bg-[#fbfaf6] dark:bg-gray-950 py-12 sm:py-16">
      <article className="mx-auto max-w-3xl px-4 sm:px-6">

        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-500">Legal</p>
        <h1 className="mt-3 font-serif text-4xl font-semibold text-slate-950 dark:text-white">Terms of Service</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Last updated: August 18, 2026 · Version 1.0</p>

        <div className="mt-10 space-y-10">

          <Section id="s1" number="1" title="Acceptance of Terms">
            <p>
              These Terms govern your use of the Minaret Network platform, operated by <strong>Cyber Shillings Data Services Inc.</strong> (corp. #1089626-8), operating as Minaret Network (&ldquo;we,&rdquo; &ldquo;us&rdquo;). By creating an account you agree to these Terms and our Privacy Policy.
            </p>
            <p>
              <strong>Minimum age: 18.</strong> Confirmed by attestation at signup, recorded with a timestamp and version, enforced identically for email/password and Google OAuth sign-up.
            </p>
          </Section>

          <Section id="s2" number="2" title="What Minaret Network Is — and Is Not">
            <p>
              Minaret Network is a directory and lead-connection platform. We are <strong>not</strong>: a professional licensing or regulatory body; a party to any contract, agreement, or transaction between a member and a professional; a guarantor of any professional&rsquo;s licensing, insurance, quality, pricing, or outcomes. We do not verify professional credentials, licences, or qualifications, and we do not verify mosque affiliation.
            </p>
            <p>
              A Featured placement, Sponsored placement, badge (including &ldquo;Highly Recommended&rdquo; — see Section 5), or Recommendation is <strong>not</strong> an endorsement by Minaret Network or by any mosque.
            </p>
          </Section>

          <Section id="s3" number="3" title="Mosque Affiliation">
            <p>
              Mosque affiliation shown on a listing, and the &ldquo;Mosque Affiliated&rdquo; badge, are self-reported by the professional. Minaret Network has no formal relationship with any mosque and does not confirm this information with the mosque named. This affiliation is not an endorsement by Minaret Network or by the mosque.
            </p>
            <p>
              Misrepresenting mosque affiliation is a violation of these Terms (Section 9) and grounds for listing rejection, suspension, or removal.
            </p>
          </Section>

          <Section id="s4" number="4" title="Professional Credentials and Listing Review">
            <p>
              Credentials, licences, qualifications, and uploaded credential files are self-reported and not independently reviewed by us. Listings go through an admin review before publication (typically 1–3 business days) and may be approved, rejected, suspended, or withdrawn; profile changes after initial approval go through a separate review step before going live.
            </p>
            <p>
              This review process checks listing content and completeness — it is <strong>not</strong> a verification of credentials, licensing, or mosque affiliation.
            </p>
            <p>
              <strong>You are responsible</strong> for independently verifying whether a professional is licensed and legally authorized to provide the service you are seeking before engaging them.
            </p>
          </Section>

          <Section id="s5" number="5" title="The &ldquo;Highly Recommended&rdquo; Badge">
            <p>
              This badge is awarded by Minaret Network administrators based on the volume and quality of member-submitted Recommendations a professional has received, using criteria we may change over time. It reflects our assessment of community feedback patterns — it is <strong>not</strong> a verification of credentials, licensing, insurance, or a guarantee of quality or outcome.
            </p>
            <p>
              This disclaimer appears directly wherever the badge is displayed (tooltip or adjacent text), not only in these Terms.
            </p>
          </Section>

          <Section id="s6" number="6" title="Recommendations">
            <p>
              Members who have engaged with a professional may submit a Recommendation. Recommendations are moderated before publication — submissions are reviewed by an admin and may be approved, rejected, or later removed. Anyone can report a published Recommendation.
            </p>
            <p>
              Recommendations must reflect genuine, honestly-described experiences. A knowingly false factual statement that harms a professional&rsquo;s reputation may be defamatory, for which the author — not Minaret Network — is primarily responsible. Nothing in these Terms attempts to exclude liability for defamatory content we host once we have actual knowledge of it and fail to act reasonably.
            </p>
          </Section>

          <Section id="s7" number="7" title="Service Requests and the Leads Dashboard">
            <p>
              Members may submit a Service Request describing what they need. Before submitting, you must explicitly consent to your request details (description and contact name — <strong>not</strong> your email or phone number) being shared with multiple eligible professionals in your selected category and service area, who see it in their leads dashboard within the Platform.
            </p>
            <p>
              Your full contact information is shared only once you initiate direct contact with a specific professional or include it in a message.
            </p>
            <p>
              <strong>Regulated professions</strong> (e.g., doctors, dentists, lawyers) are excluded from this feature — you must contact these professionals directly through their listing.
            </p>
          </Section>

          <Section id="s8" number="8" title="AI-Assisted Matching">
            <p>
              We use an AI system to help match your Service Request to the right professional category, based on your request description, approximate location, and available categories. This is an automated matching aid, not professional advice, and may be inaccurate or incomplete. Use your own judgment about which professional to contact.
            </p>
          </Section>

          <Section id="s9" number="9" title="Prohibited Conduct">
            <p>You agree not to:</p>
            <Ul>
              <li>provide false information, including false credentials or false mosque affiliation, or falsely declare an event as mosque-organized</li>
              <li>post fake or manipulated Recommendations, or review your own business</li>
              <li>harass, threaten, or defame another user</li>
              <li>post hate speech or discriminatory content</li>
              <li>misuse the messaging system for spam or unrelated solicitation</li>
              <li>scrape or systematically extract Platform data</li>
              <li>attempt to circumvent security or moderation systems</li>
              <li>upload malware or harmful files</li>
              <li>place unnecessary sensitive personal information in public listings, requests, reviews, or messages</li>
              <li>otherwise materially interfere with the Platform or its users</li>
            </Ul>
          </Section>

          <Section id="s10" number="10" title="Accounts">
            <p>
              You may edit or withdraw your own professional listing and manage your account through your dashboard. Notify us promptly of any unauthorized account use. Google OAuth sign-in is subject to the same age-attestation and Terms-acceptance requirements as email/password sign-up — you will not have access to the Platform until both are completed, regardless of sign-in method.
            </p>
          </Section>

          <Section id="s11" number="11" title="Featured Business Placement">
            <p>
              A Featured Business card appears in the homepage &ldquo;Featured Businesses&rdquo; section for your selected GTA region. Your listing must be APPROVED status to apply; region is determined by your selected service area; all applications are reviewed by an admin before going live.
            </p>

            <p><strong>Slot structure:</strong> 6 slots per region across 7 defined GTA regions.</p>

            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left py-2 pr-4 font-semibold text-slate-900 dark:text-white">Region</th>
                    <th className="text-left py-2 font-semibold text-slate-900 dark:text-white">Cities included</th>
                  </tr>
                </thead>
                <tbody>
                  {REGIONS.map((r) => (
                    <tr key={r.name} className="border-b border-slate-100 dark:border-slate-800">
                      <td className="py-2 pr-4 font-medium text-slate-900 dark:text-slate-200 whitespace-nowrap">{r.name}</td>
                      <td className="py-2 text-slate-600 dark:text-slate-400">{r.cities}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p>
              <strong>Pricing:</strong> Free until October 31, 2026. From November 1, 2026: CAD $29.99/month, billed as a 30-day rolling term starting from the date of admin approval (not calendar-month billing). One Featured placement per business during the free period.
            </p>
            <p>
              <strong>Waitlist:</strong> If all 6 regional slots are full, you are automatically waitlisted and notified when a slot opens — first-come, first-served. No fee is charged while waitlisted; billing begins only once a slot is assigned and the listing goes live.
            </p>
            <p>
              <strong>Cancellation:</strong> Cancel any time from your dashboard. Cancellation takes effect and no further charges apply after your current 30-day term.
            </p>
            <p>
              <strong>Free-to-paid transition:</strong> Free placements expire on October 31, 2026 and are not automatically converted to paid subscriptions. To continue appearing as a Featured Business from November 1, 2026 onward, professionals must reapply through their dashboard and provide a payment method at that time. There is no automatic charge at the end of the free period.
            </p>
          </Section>

          <Section id="s12" number="12" title="Sponsored Listing Placement">
            <p>
              Your listing is pinned to the top of directory search results for your category across your entire selected GTA region. There are 3 slots per category per region, across the same 7 regions listed in Section 11. Same APPROVED-status eligibility and admin-review requirements as Featured Business.
            </p>
            <p>
              <strong>Pricing:</strong> Free until October 31, 2026. From November 1, 2026: CAD $19.99/month baseline, billed as a 30-day rolling term from admin approval. Pricing may vary by category and service area at our discretion; the current price for a given category/region is shown at the time of application. One Sponsored placement per business during the free period.
            </p>
            <p>
              The same waitlist mechanics, cancellation terms, and free-to-paid transition policy described in Section 11 apply here — free placements expire October 31, 2026 and professionals must reapply with a payment method to continue from November 1, 2026. No automatic charges.
            </p>
          </Section>

          <Section id="s13" number="13" title="Event Listings">
            <p>
              Any registered user may submit a community event listing. All submissions are reviewed by an admin before going live. A listing runs for 30 days from admin approval, or until the event date, whichever is sooner.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left py-2 pr-6 font-semibold text-slate-900 dark:text-white">Tier</th>
                    <th className="text-left py-2 pr-6 font-semibold text-slate-900 dark:text-white">Price</th>
                    <th className="text-left py-2 font-semibold text-slate-900 dark:text-white">What it includes</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    <td className="py-2 pr-6 font-medium text-slate-900 dark:text-slate-200 whitespace-nowrap">Mosque-organized</td>
                    <td className="py-2 pr-6 whitespace-nowrap">Free</td>
                    <td className="py-2 text-slate-600 dark:text-slate-400">Standard listing. Self-declared; misrepresentation is a violation of these Terms.</td>
                  </tr>
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    <td className="py-2 pr-6 font-medium text-slate-900 dark:text-slate-200 whitespace-nowrap">Standard</td>
                    <td className="py-2 pr-6 whitespace-nowrap">CAD $24.99 (one-time)</td>
                    <td className="py-2 text-slate-600 dark:text-slate-400">Listing in the community events grid.</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-6 font-medium text-slate-900 dark:text-slate-200 whitespace-nowrap">Featured</td>
                    <td className="py-2 pr-6 whitespace-nowrap">CAD $49.99 (one-time)</td>
                    <td className="py-2 text-slate-600 dark:text-slate-400">Highlighted at the top of the events page with a Featured badge.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p>
              <strong>Payment and refunds.</strong> Payment is processed through Stripe at the time of submission, before admin review. If your submission is rejected by admin review, you will receive a full refund — you should not pay for a listing that never goes live. Once a paid listing has been approved and goes live, it is non-refundable, except where the listing is removed due to an error or outage caused by Minaret Network.
            </p>
            <p>
              Event listings are a passive, on-site placement only — they are not distributed by email, SMS, WhatsApp, or push notification. Minaret Network does not organize, run, or guarantee any listed event, and promoting an event is not an endorsement.
            </p>
          </Section>

          <Section id="s14" number="14" title="Contact Information on Listings">
            <p>
              Professionals control what contact information is shown on their listing (phone, email, website, WhatsApp). Where a WhatsApp number is displayed, clicking it opens a direct conversation between you and the professional through WhatsApp — Minaret Network is not a party to that conversation and does not process its content. This is distinct from the in-Platform Service Request leads dashboard described in Section 7.
            </p>
          </Section>

          <Section id="s15" number="15" title="Cookies and Analytics">
            <p>
              Essential cookies are required for authentication and cannot be declined. A regional preference cookie (<code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">mn_region</code>) stores only your selected GTA region — no personal data — for 30 days.
            </p>
            <p>
              Optional analytics (Google Analytics, Contentsquare) load only if you choose &ldquo;Accept all&rdquo; in the cookie consent banner; you can withdraw this consent at any time by clearing your site data, after which the banner will prompt you again.
            </p>
          </Section>

          <Section id="s16" number="16" title="Suspension and Termination">
            <p>
              We may suspend, reject, or remove an account, listing, Recommendation, or Event Listing that violates these Terms, misrepresents credentials or mosque/organizer affiliation, or is otherwise fraudulent, misleading, or unsafe — at our discretion, consistent with the review and reporting mechanisms described throughout these Terms.
            </p>
          </Section>

          <Section id="s17" number="17" title="Intellectual Property">
            <p>
              Our name, logo, and platform are owned by Cyber Shillings Data Services Inc. You retain ownership of content you submit (listings, Recommendations, photos, event details, messages) and grant us a licence to host and display it for the purpose of operating the Platform. Copyright complaints follow Canada&rsquo;s notice-and-notice regime under the <em>Copyright Act</em>.
            </p>
          </Section>

          <Section id="s18" number="18" title="Limitation of Liability">
            <p>
              Nothing in this section limits liability that cannot be limited under Ontario or Canadian law, including liability for gross negligence, wilful misconduct, or rights that cannot be excluded under applicable consumer-protection legislation.
            </p>
            <p>
              Subject to that carve-out: the Platform is provided &ldquo;as is&rdquo;; we are not liable for the acts of any professional, event organizer, or other user; we exclude indirect, incidental, and consequential damages; our total liability is capped at the greater of amounts you paid us in the prior 12 months or CAD $100.
            </p>
          </Section>

          <Section id="s19" number="19" title="Dispute Resolution and Governing Law">
            <p>
              These Terms are governed by the laws of Ontario and applicable federal Canadian law. Disputes may be brought in the courts of Ontario. We do not require mandatory arbitration for consumer-facing disputes.
            </p>
          </Section>

          <Section id="s20" number="20" title="Changes to These Terms">
            <p>
              We may update these Terms. Material changes require renewed acceptance (enforced through the versioned Terms-acceptance mechanism at sign-in), with advance notice before the new version takes effect.
            </p>
          </Section>

          <Section id="s21" number="21" title="Contact">
            <p>
              <strong>Cyber Shillings Data Services Inc.</strong>, operating as Minaret Network (corp. #1089626-8)<br />
              Email: <a href="mailto:salam@minaretnetwork.ca" className="text-emerald-700 dark:text-emerald-400 underline underline-offset-2 hover:no-underline">salam@minaretnetwork.ca</a><br />
              Mailing address: 330 Highway 7 East, Richmond Hill, Ontario, L4B 3P8
            </p>
          </Section>

        </div>
      </article>
    </main>
  );
}
