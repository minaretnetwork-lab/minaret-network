import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms governing use of Minaret Network.",
};

const sections = [
  {
    title: "Eligibility and acceptance",
    paragraphs: [
      "You must be at least 18 years old to create an account. By creating or continuing to use an account, you agree to these Terms and the Privacy Policy and confirm that the information you provide is accurate.",
    ],
  },
  {
    title: "Community directory—not an endorsement",
    paragraphs: [
      "Minaret Network is a community directory and communication platform. Unless a listing expressly says otherwise, we do not independently verify or guarantee professional licences, credentials, insurance, experience, availability, quality, pricing, mosque affiliation, or suitability.",
      "A listing, badge, recommendation, featured placement, sponsored placement, or self-reported mosque affiliation is not an endorsement by Minaret Network or by any mosque. You are responsible for performing the checks appropriate to the service before hiring or relying on a professional.",
    ],
  },
  {
    title: "Service requests and communications",
    paragraphs: [
      "When you submit a service request, you authorize Minaret Network to share its relevant details through the platform with eligible matching professionals. The request form identifies this sharing before submission. Regulated-profession categories may be excluded from broadcast requests and instead require direct one-to-one contact.",
      "Platform messaging is provided for convenience. Users are responsible for their communications, agreements, payments, appointments, and any work arranged through the service. Minaret Network is not a party to contracts between members and professionals.",
    ],
  },
  {
    title: "Professional listings",
    paragraphs: [
      "Professionals must keep their identity, business, category, credentials, service area, contact, and affiliation information accurate and current. They must comply with applicable licensing, advertising, consumer-protection, privacy, and professional rules. Administrators may request supporting information, reject or suspend listings, change visibility, or remove misleading content.",
    ],
  },
  {
    title: "Reviews, recommendations, and reports",
    paragraphs: [
      "Recommendations must reflect genuine experience and must not be deceptive, defamatory, discriminatory, threatening, or submitted in exchange for undisclosed compensation. Users may report content for review. Administrators may dismiss reports, remove content, or take account action when reasonably necessary to protect the community or enforce these Terms.",
    ],
  },
  {
    title: "Acceptable use",
    paragraphs: [
      "Do not misuse the platform, impersonate others, scrape or resell directory data, bypass access controls, send spam, upload malicious material, collect contact information without a legitimate purpose, or use the service for unlawful, unsafe, discriminatory, or fraudulent activity. Do not place unnecessary sensitive personal information in public listings, requests, reviews, or messages.",
    ],
  },
  {
    title: "Availability and responsibility",
    paragraphs: [
      "The service is provided on an as-available basis. We may change, suspend, or discontinue features and cannot guarantee uninterrupted availability, successful matches, professional performance, or a particular outcome. To the extent permitted by law, Minaret Network is not responsible for indirect losses or for the acts, omissions, advice, services, products, or disputes of users or listed professionals.",
    ],
  },
  {
    title: "Accounts, updates, and governing law",
    paragraphs: [
      "You may stop using the service or request account deletion. We may restrict or close accounts that present security, legal, or community-safety risks or materially violate these Terms. We may update these Terms, and material changes may require renewed acceptance.",
      "These Terms are governed by the laws applicable in Ontario and Canada. Questions or concerns may be directed to the Minaret Network administrator through the support or mosque-community contact channel provided to you.",
    ],
  },
];

export default function TermsPage() {
  return (
    <main className="bg-[#fbfaf6] py-12 sm:py-16">
      <article className="mx-auto max-w-3xl px-4 sm:px-6">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">Legal</p>
        <h1 className="mt-3 font-serif text-4xl font-semibold text-slate-950">Terms of Service</h1>
        <p className="mt-3 text-sm text-slate-500">Effective August 15, 2026 · Version 1.0</p>
        <p className="mt-8 text-base leading-7 text-slate-700">
          These Terms set the rules for using Minaret Network as a member, professional, recommender, or visitor.
        </p>
        <div className="mt-10 space-y-9">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="font-serif text-2xl font-semibold text-slate-950">{section.title}</h2>
              <div className="mt-3 space-y-3 text-sm leading-7 text-slate-700">
                {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              </div>
            </section>
          ))}
        </div>
      </article>
    </main>
  );
}
