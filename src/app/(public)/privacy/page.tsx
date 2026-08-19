import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Minaret Network collects, uses, and protects personal information.",
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

function SubSection({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">{number} {title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
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

const VENDORS = [
  {
    name: "Supabase (self-hosted in Canada)",
    purpose: "Authentication, database, file storage",
    data: "All application data",
    note: "Confirm hosting location remains Canada if infrastructure changes.",
  },
  {
    name: "Stripe",
    purpose: "Payment processing for Event Listings and paid placements",
    data: "Payment details (never stored by us directly), email, name",
    note: null,
  },
  {
    name: "OpenAI",
    purpose: "AI-assisted category matching for service requests",
    data: "Request description, approximate location text, category list — not email or phone",
    note: null,
  },
  {
    name: "Google (OAuth)",
    purpose: "Optional sign-in",
    data: "Google account ID, email, name",
    note: null,
  },
  {
    name: "Google Analytics (opt-in)",
    purpose: "Usage analytics",
    data: "Anonymized page views and interactions",
    note: null,
  },
  {
    name: "Contentsquare (opt-in)",
    purpose: "Heatmaps, session replay, feedback tools",
    data: "Anonymized interaction data",
    note: "Confirm specific data-hosting region before publication.",
  },
  {
    name: "Cloudflare",
    purpose: "CDN and DDoS protection",
    data: "IP addresses (standard proxy/security logging)",
    note: null,
  },
];

const RETENTION = [
  { category: "Account information", approach: "Retained while active; period after account deletion to be confirmed." },
  { category: "Professional listings", approach: "Retained while active/approved; period after withdrawal or rejection to be confirmed." },
  { category: "Service requests and messages", approach: "Retention period to be confirmed — retained as needed to support dispute resolution." },
  { category: "Recommendations", approach: "Retained as part of the public record unless removed through moderation." },
  { category: "Consent audit trail (including IP)", approach: "Recommended: life of the account plus a defined window afterward, as evidentiary record of consent. Period to be confirmed." },
  { category: "Analytics data", approach: "Per Google Analytics / Contentsquare's own retention settings — confirm with vendors." },
  { category: "Payment records (Stripe)", approach: "As required by Canadian tax law — generally at least 6 years." },
];

export default function PrivacyPage() {
  return (
    <main className="bg-[#fbfaf6] dark:bg-gray-950 py-12 sm:py-16">
      <article className="mx-auto max-w-3xl px-4 sm:px-6">

        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-500">Legal</p>
        <h1 className="mt-3 font-serif text-4xl font-semibold text-slate-950 dark:text-white">Privacy Policy</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Last updated: August 18, 2026</p>

        <div className="mt-10 space-y-10">

          <Section id="s1" number="1" title="Who We Are">
            <p>
              This Privacy Policy explains how <strong>Cyber Shillings Data Services Inc.</strong> (corporation number 1089626-8), operating as Minaret Network (&ldquo;we,&rdquo; &ldquo;us&rdquo;), collects, uses, discloses, and protects personal information through the Minaret Network platform at minaretnetwork.ca, serving the Greater Toronto Area and surrounding communities.
            </p>
            <p>
              Minaret Network is a community professional directory. Members search for and contact professionals; professionals list their services. We do not independently verify professional credentials, licences, qualifications, or mosque affiliation. Mosque affiliation is self-reported by the professional — see Section 4.
            </p>
          </Section>

          <Section id="s2" number="2" title="Information We Collect">

            <SubSection number="2.1" title="At registration">
              <p>
                First name, last name, display name, email address, avatar (optional), phone number (optional), WhatsApp number (optional), preferred contact method (email/phone/WhatsApp), mosque affiliation (optional for members, required for professionals), Google account ID/name/email if signing in with Google OAuth, age-attestation timestamp and version, Terms of Service acceptance timestamp and version.
              </p>
            </SubSection>

            <SubSection number="2.2" title="Professional listings">
              <p>
                Business name, professional title, bio, primary and optional secondary categories, service areas (selected from a defined list of GTA-area cities), languages spoken, years of experience, qualifications and licences (self-reported), uploaded credential files (not independently reviewed by us — see Section 4), gender (optional), business address (optional), contact details the professional chooses to display (phone, email, website, WhatsApp), profile photo, logo, gallery images, and whether walk-ins are accepted.
              </p>
            </SubSection>

            <SubSection number="2.3" title="Service requests">
              <p>
                Description of the request, category, selected service area, contact name, email, phone number, preferred contact method, preferred date, and a broadcast-consent timestamp and version (see Section 9A).
              </p>
            </SubSection>

            <SubSection number="2.4" title="Messages">
              <p>
                Content of messages exchanged between a member and a professional through the Platform&rsquo;s messaging feature, timestamps, and read status.
              </p>
            </SubSection>

            <SubSection number="2.5" title="Event listings">
              <p>
                Event title, description, date/time, location, organizer information, price paid (if any), event image, and whether the event is declared as mosque-organized.
              </p>
            </SubSection>

            <SubSection number="2.6" title="Recommendations and reports">
              <p>
                Recommendation content, moderation status and history, reports submitted about a listing or recommendation, and related admin notes.
              </p>
            </SubSection>

            <SubSection number="2.7" title="Automatically collected / technical information">
              <Ul>
                <li><strong>Essential cookies</strong> — required for authentication sessions and saved preferences; cannot be declined.</li>
                <li><strong>mn_region cookie</strong> — stores only the name of the GTA region you select when searching (e.g., &ldquo;York South&rdquo;), used to show geographically relevant Featured Businesses on the homepage. No personal information. 30-day lifespan.</li>
                <li><strong>Analytics cookies (optional, consent-gated)</strong> — Google Analytics and Contentsquare, described in Section 8. These do not load unless you choose &ldquo;Accept all&rdquo; in the cookie banner.</li>
                <li><strong>Standard server/proxy logs</strong> (including IP address) via our CDN provider, Cloudflare.</li>
              </Ul>
            </SubSection>

            <SubSection number="2.8" title="Analytics per professional listing">
              <p>
                Profile views, search appearances, and contact clicks (phone/website/WhatsApp), and — for Featured placements — impressions and card/website/phone/WhatsApp clicks. This is aggregated performance data shown to the professional about their own listing; we do not sell or share this data with third parties.
              </p>
            </SubSection>

            <SubSection number="2.9" title="Consent audit trail">
              <p>
                We keep a record of consent events (age attestation, Terms acceptance, broadcast consent, cookie choice) including the version consented to, the timestamp, and the IP address at the time of consent, for accountability and compliance purposes.
              </p>
            </SubSection>

          </Section>

          <Section id="s3" number="3" title="Why We Collect and Use Information">
            <Ul>
              <li>To create and administer accounts, including authenticating you via email/password or Google OAuth.</li>
              <li>To operate the professional directory — publish and display professional listings (including self-reported mosque affiliation and credentials), route them through admin review before they go live, and let members search and browse them.</li>
              <li>To connect members and professionals — process service requests, display them to eligible professionals in their leads dashboard (see Section 9A), and enable in-Platform messaging.</li>
              <li>To display Recommendations and badges submitted or awarded through the Platform, subject to moderation.</li>
              <li>To assist category-matching for service requests using AI — see Section 6.</li>
              <li>To show relevant Featured Businesses by region, using the mn_region cookie.</li>
              <li>To operate paid placements (Featured Business, Sponsored Listing, Event Listings) and process the associated payments through Stripe.</li>
              <li>To maintain Platform security and integrity — detect fraud, impersonation, abuse of messaging, and violations of our Terms of Service.</li>
              <li>To communicate with you about your account, service requests, messages, and Platform updates. We do not currently send direct marketing communications.</li>
              <li>To analyze and improve the Platform, using Google Analytics and Contentsquare where you have consented (Section 8).</li>
              <li>To comply with legal obligations and enforce our Terms of Service.</li>
            </Ul>
          </Section>

          <Section id="s4" number="4" title="Mosque Affiliation — Self-Reported, Not Verified">
            <p>
              Mosque affiliation displayed on a professional&rsquo;s listing, and the &ldquo;Mosque Affiliated&rdquo; badge, reflect what the professional themselves has stated. Minaret Network does not have a formal relationship with any mosque, does not maintain a verified or approved list of mosques, and does not confirm a professional&rsquo;s stated affiliation with the mosque in question. A professional&rsquo;s affiliation claim is not endorsed, confirmed, or vouched for by the named mosque, and appearing with a mosque&rsquo;s name on a listing does not mean that mosque has any relationship with Minaret Network or has reviewed the professional in any way.
            </p>
            <p>
              We treat mosque affiliation as sensitive personal information. In practice this means: we ask for explicit, separate consent before a professional&rsquo;s mosque affiliation is published (distinct from general account consent), and we do not infer or publish a member&rsquo;s own religious affiliation from their activity on the Platform.
            </p>
            <Warning>
              Do not describe mosque affiliation anywhere on the Platform as &ldquo;confirmed,&rdquo; &ldquo;community-attested,&rdquo; &ldquo;verified,&rdquo; or as being with a &ldquo;participating&rdquo; mosque — these terms imply a level of confirmation or formal mosque relationship that does not exist. Use &ldquo;self-reported&rdquo; consistently in all user-facing copy.
            </Warning>
          </Section>

          <Section id="s5" number="5" title="The &ldquo;Highly Recommended&rdquo; Badge">
            <p>
              Some professionals display a &ldquo;Highly Recommended&rdquo; badge, awarded by Minaret Network administrators based on the volume and quality of Recommendations a professional has received on the Platform. Unlike Sponsored or Featured placement, this badge is not purchased — it reflects our own internal assessment of community feedback patterns, using criteria we may change over time.
            </p>
            <p>
              It is not a guarantee of a professional&rsquo;s licensing, insurance, quality of work, or any outcome, and it is not independent verification of anything the professional has told us. A clear disclaimer appears directly wherever the badge is displayed.
            </p>
          </Section>

          <Section id="s6" number="6" title="AI-Assisted Category Matching">
            <p>
              When you submit a service request, we use an AI system (OpenAI) to help match your request description to the right professional category. The AI receives your request description, an approximate location text, and the list of available categories. It does <strong>not</strong> receive your email or phone number. If the AI service is unavailable, local matching rules are used instead.
            </p>
            <p>
              If a broader AI assistant feature is added in the future, this section will be updated and users will be provided with appropriate guidance before that feature goes live.
            </p>
          </Section>

          <Section id="s7" number="7" title="Location">
            <p>
              Minaret Network does not collect precise device GPS coordinates. Location-based features work by manually selecting a service area (a city within a defined list covering the GTA and surrounding areas) — there is no location permission prompt and no precise-coordinate data collected or stored.
            </p>
          </Section>

          <Section id="s8" number="8" title="Cookies, Analytics, and Third-Party Services">
            <p>
              <strong>Cookie consent.</strong> On your first visit, a banner offers two choices: &ldquo;Essential only&rdquo; or &ldquo;Accept all.&rdquo; Your choice is stored in your browser (localStorage). Google Analytics and Contentsquare do not load unless you choose &ldquo;Accept all.&rdquo; You can withdraw consent at any time by clearing your site data in your browser, which resets the banner.
            </p>

            <p><strong>Third parties who process information on our behalf:</strong></p>

            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left py-2 pr-4 font-semibold text-slate-900 dark:text-white">Service</th>
                    <th className="text-left py-2 pr-4 font-semibold text-slate-900 dark:text-white">Purpose</th>
                    <th className="text-left py-2 font-semibold text-slate-900 dark:text-white">What&rsquo;s sent</th>
                  </tr>
                </thead>
                <tbody>
                  {VENDORS.map((v) => (
                    <tr key={v.name} className="border-b border-slate-100 dark:border-slate-800 align-top">
                      <td className="py-2 pr-4 font-medium text-slate-900 dark:text-slate-200">
                        {v.name}
                        {v.note && <span className="block text-amber-700 dark:text-amber-400 font-normal mt-0.5">{v.note}</span>}
                      </td>
                      <td className="py-2 pr-4 text-slate-600 dark:text-slate-400">{v.purpose}</td>
                      <td className="py-2 text-slate-600 dark:text-slate-400">{v.data}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p>
              <strong>Cross-border processing.</strong> Stripe, OpenAI, Google, Google Analytics, and Contentsquare all involve processing outside Canada to varying degrees (primarily the United States). Supabase is currently self-hosted in Canada — this is our lowest cross-border exposure vendor; we will update this Policy if the infrastructure location changes.
            </p>
          </Section>

          <Section id="s9" number="9" title="Recommendations, Reports, and Messages">
            <p>
              Recommendations submitted by members go through admin moderation before publication — they are not visible until reviewed and approved. Admins may reject or later remove a Recommendation that violates our Community Standards. Anyone can report a published Recommendation or an event listing for review.
            </p>
            <p>
              Messages sent through the in-Platform messaging system are visible to their intended recipient. We do not routinely read message content, but may access it to investigate suspected abuse, fraud, or violations of our Terms, or to respond to a valid legal request.
            </p>
          </Section>

          <Section id="s9a" number="9A" title="Service Requests and the Leads Dashboard">
            <p>
              When you submit a service request, we ask for your explicit, separate consent (distinct from general account consent) confirming that your request details will be shared with multiple eligible professionals. Eligible professionals — those with an approved listing, broadcast-eligible status, and a matching category and service area — see your request in their leads dashboard within the Platform.
            </p>
            <p>
              <strong>Your email and phone number are not shown in the leads dashboard.</strong> Professionals see your request description and contact name only. Your full contact details are shared only once you initiate direct contact with a specific professional or choose to include them in a message.
            </p>
            <p>
              Regulated professions (doctors, dentists, lawyers, and similar categories) are excluded from this feature — service requests cannot be submitted for these categories and members must contact these professionals directly through their listing. No third-party messaging platform (e.g., WhatsApp) is involved in distributing service requests; this is a fully in-Platform feature.
            </p>
          </Section>

          <Section id="s10" number="10" title="Data Retention">
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left py-2 pr-6 font-semibold text-slate-900 dark:text-white">Category</th>
                    <th className="text-left py-2 font-semibold text-slate-900 dark:text-white">Approach</th>
                  </tr>
                </thead>
                <tbody>
                  {RETENTION.map((r) => (
                    <tr key={r.category} className="border-b border-slate-100 dark:border-slate-800 align-top">
                      <td className="py-2 pr-6 font-medium text-slate-900 dark:text-slate-200 whitespace-nowrap">{r.category}</td>
                      <td className="py-2 text-slate-600 dark:text-slate-400">{r.approach}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Warning>
              Specific retention periods are not yet finalized. The items marked &ldquo;to be confirmed&rdquo; above must be set before this Policy is considered complete. Indefinite retention without a stated period is not compliant with PIPEDA.
            </Warning>
          </Section>

          <Section id="s11" number="11" title="Your Rights">
            <p>
              You may request access to, correction of, or deletion of your personal information, and may withdraw consent, subject to legal limits. To exercise these rights, contact our Privacy Officer (Section 13). Some account and listing data can also be updated or removed directly through your dashboard.
            </p>
          </Section>

          <Section id="s12" number="12" title="Complaints">
            <p>
              If you have a privacy concern, please contact our Privacy Officer first (Section 13). If the concern is not resolved to your satisfaction, you may have the right to complain to the <strong>Office of the Privacy Commissioner of Canada</strong>. Ontario does not currently have its own general private-sector privacy regulator.
            </p>
          </Section>

          <Section id="s13" number="13" title="Contact">
            <p>
              <strong>Legal entity:</strong> Cyber Shillings Data Services Inc. (corp. #1089626-8), operating as Minaret Network<br />
              <strong>Privacy Officer:</strong> Syed Nafeez Ul Haq<br />
              <strong>Email:</strong>{" "}
              <a href="mailto:salam@minaretnetwork.ca" className="text-emerald-700 dark:text-emerald-400 underline underline-offset-2 hover:no-underline">
                salam@minaretnetwork.ca
              </a><br />
              <strong>Mailing address:</strong> 330 Highway 7 East, Richmond Hill, Ontario, L4B 3P8
            </p>
          </Section>

        </div>
      </article>
    </main>
  );
}
