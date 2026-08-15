import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Minaret Network collects, uses, and protects personal information.",
};

const sections = [
  {
    title: "Information we collect",
    paragraphs: [
      "We collect account and profile information such as your name, email address, phone number, sign-in details, communication preferences, and consent records. Professional listings may also contain business details, service areas, mosque affiliation, credentials, photos, and other information you choose to publish.",
      "When you request a service or use messaging, we process the request description, approximate service location, preferred contact method, messages, and related activity. We also keep moderation, recommendation, reporting, and audit records needed to operate the community directory safely.",
    ],
  },
  {
    title: "How we use information",
    paragraphs: [
      "We use personal information to create and secure accounts, publish and moderate listings, match members with relevant professionals, operate service requests and conversations, respond to reports, maintain consent records, prevent misuse, and improve the service.",
      "A service request is made visible only to eligible matching professionals through the platform. Professionals do not receive the member's email address or phone number through the leads dashboard. Direct contact details are shared only through member-initiated contact or messages where the member chooses to provide them.",
    ],
  },
  {
    title: "AI matching and location",
    paragraphs: [
      "The match assistant may send your service issue, approximate location text, and available category names to OpenAI to classify the request. It does not send your account email or phone number in that classification request. If the AI service is unavailable, local matching rules are used instead.",
      "If you choose Use my current location, your browser asks for permission. Coordinates are used to identify a nearby city or service area through the locally operated geocoding service. You may type a city or area instead.",
    ],
  },
  {
    title: "Analytics choices",
    paragraphs: [
      "Essential storage keeps you signed in and remembers necessary preferences. With your express permission, Google Analytics and Contentsquare may collect usage information. Contentsquare can provide heatmaps, session replay, and feedback tools. These analytics tools do not load when you choose Essential only.",
      "You can withdraw analytics consent by clearing the site's local storage or browser site data, after which the consent banner will ask again. The temporary upgrades page on minaretnetwork.ca and www.minaretnetwork.ca does not load these analytics tools.",
    ],
  },
  {
    title: "Storage, service providers, and safeguards",
    paragraphs: [
      "Application data, authentication, and uploaded files are currently hosted in a self-managed Supabase and PostgreSQL environment in Canada. Cloudflare provides secure public routing. Google may process OAuth sign-in information when you choose Google login. OpenAI, Google Analytics, and Contentsquare process only the information described above for their respective purposes.",
      "We use access controls, authenticated server actions, role checks, database safeguards, and backups to protect information. No internet service can guarantee absolute security, so please avoid placing unnecessary sensitive information in listings, requests, reviews, or messages.",
    ],
  },
  {
    title: "Retention and your choices",
    paragraphs: [
      "We retain information while your account or listing is active and as reasonably needed for service delivery, security, dispute handling, legal obligations, and backups. Archiving hides eligible requests or conversations from active views but does not delete them.",
      "You can update profile and listing information from your dashboard. You may request access or correction and can use the account deletion control in your profile. Some limited records may be retained where reasonably required for security, legal compliance, or resolving disputes.",
    ],
  },
  {
    title: "Age, changes, and questions",
    paragraphs: [
      "Minaret Network accounts are intended for people who are at least 18 years old. We may update this policy when our practices or service providers change. Material changes may require you to review and accept an updated version before continuing.",
      "For privacy questions, access requests, or complaints, contact the Minaret Network administrator through the support or mosque-community contact channel provided to you. We will verify identity before disclosing or changing account information.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <main className="bg-[#fbfaf6] py-12 sm:py-16">
      <article className="mx-auto max-w-3xl px-4 sm:px-6">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">Legal</p>
        <h1 className="mt-3 font-serif text-4xl font-semibold text-slate-950">Privacy Policy</h1>
        <p className="mt-3 text-sm text-slate-500">Effective August 15, 2026 · Version 1.0</p>
        <p className="mt-8 text-base leading-7 text-slate-700">
          This policy explains what Minaret Network collects, why it is used, who may receive it, and the choices available to you.
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
