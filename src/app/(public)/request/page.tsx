export const dynamic = "force-dynamic";

import { ServiceRequestForm } from "@/components/service-request-form";
import { prisma } from "@/lib/prisma";
import { DEFAULT_MOSQUE_SLUG } from "@/lib/constants";
import { FileText, Users, MessageSquare, CheckCircle2 } from "lucide-react";
import { getCurrentUser } from "@/lib/actions/auth";

export const metadata = { title: "Raise a Service Request | Minaret Network" };

const HOW_IT_WORKS = [
  {
    icon: <FileText className="h-5 w-5 text-emerald-600" />,
    title: "Describe your job",
    desc: "Tell us what you need — the more detail you provide, the better the quotes you'll receive.",
  },
  {
    icon: <Users className="h-5 w-5 text-emerald-600" />,
    title: "Professionals are notified",
    desc: "Your request goes to verified professionals in your chosen category and service area.",
  },
  {
    icon: <MessageSquare className="h-5 w-5 text-emerald-600" />,
    title: "Receive multiple quotes",
    desc: "Interested professionals reach out directly via your preferred contact. Compare, ask questions, and choose who you trust.",
  },
];

export default async function RequestPage() {
  const [user, mosque] = await Promise.all([
    getCurrentUser(),
    prisma.mosque.findUnique({
      where: { slug: DEFAULT_MOSQUE_SLUG },
      include: {
        categories: { where: { isActive: true }, orderBy: { name: "asc" } },
        serviceAreas: { orderBy: { name: "asc" } },
      },
    }),
  ]);

  // Pre-fill contact details from user profile
  const defaultEmail = user?.email ?? "";
  const defaultPhone = user?.phone ?? "";
  const defaultWhatsapp = user?.whatsapp ?? "";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">

      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 py-8 sm:py-12 px-4">
        <div className="container mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/40 px-3 py-1 rounded-full text-xs font-semibold mb-5">
            <FileText className="h-3.5 w-3.5" />
            Service Request
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3" style={{ fontFamily: "var(--font-playfair)" }}>
            Describe your job. Get multiple quotes.
          </h1>
          <p className="text-gray-500 dark:text-gray-400 leading-relaxed max-w-lg mx-auto">
            Submit one request and let verified community professionals come to you — no cold calling, no searching.
            The clearer your description, the better the quotes you&apos;ll receive.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 max-w-4xl">
        <div className="grid lg:grid-cols-5 gap-4 lg:gap-8">

          {/* Left: how it works */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">How it works</p>
              <div className="space-y-5">
                {HOW_IT_WORKS.map((step, i) => (
                  <div key={i} className="flex gap-3.5">
                    <div className="h-9 w-9 flex-shrink-0 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                      {step.icon}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{step.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/40 rounded-xl p-4">
              <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 mb-2.5">Tips for a great request</p>
              <ul className="space-y-1.5">
                {[
                  "Include approximate size or scope of the job",
                  "Mention your preferred timeline",
                  "Note any specific requirements or access constraints",
                  "Add photos if helpful — describe what you see",
                ].map((tip) => (
                  <li key={tip} className="flex items-start gap-2 text-xs text-emerald-800 dark:text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-emerald-500" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            <p className="text-xs text-gray-400 dark:text-gray-600 leading-relaxed">
              All professionals on Minaret Network are mosque community members, verified by our administration.
              Your contact details are only shared with professionals who respond to your request.
            </p>
          </div>

          {/* Right: form */}
          <div className="lg:col-span-3">
            <ServiceRequestForm
              categories={mosque?.categories ?? []}
              serviceAreas={mosque?.serviceAreas ?? []}
              defaultEmail={defaultEmail}
              defaultPhone={defaultPhone}
              defaultWhatsapp={defaultWhatsapp}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
