export const dynamic = "force-dynamic";

import { ServiceRequestForm } from "@/components/service-request-form";
import { prisma } from "@/lib/prisma";
import { DEFAULT_MOSQUE_SLUG } from "@/lib/constants";
import { getCurrentUser } from "@/lib/actions/auth";

export const metadata = { title: "Service Request | Minaret Network" };

export default async function RequestPage() {
  const [user, mosque, approvedProfessionals] = await Promise.all([
    getCurrentUser().catch(() => null),
    prisma.mosque.findUnique({
      where: { slug: DEFAULT_MOSQUE_SLUG },
      include: {
        categories: {
          where: { isActive: true },
          orderBy: { name: "asc" },
          select: { id: true, name: true, slug: true, icon: true, isRegulatedProfession: true },
        },
        serviceAreas: { orderBy: { name: "asc" } },
      },
    }),
    prisma.professional.findMany({
      where: { status: "APPROVED" },
      select: {
        category: { select: { slug: true } },
        categories: { select: { slug: true } },
      },
    }),
  ]);

  // Count approved professionals per category slug (primary + additional, deduplicated per professional)
  const countBySlug: Record<string, number> = {};
  for (const p of approvedProfessionals) {
    const slugs = new Set<string>();
    if (p.category?.slug) slugs.add(p.category.slug);
    for (const c of p.categories) slugs.add(c.slug);
    for (const slug of slugs) countBySlug[slug] = (countBySlug[slug] ?? 0) + 1;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-start py-12 px-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2" style={{ fontFamily: "var(--font-lora)" }}>
            Find a professional
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Answer a few quick questions and mosque-affiliated professionals will reach out to you.
          </p>
        </div>

        <ServiceRequestForm
          categories={(mosque?.categories ?? []).map((category) => ({
            ...category,
            professionalCount: countBySlug[category.slug] ?? 0,
          }))}
          serviceAreas={mosque?.serviceAreas ?? []}
          isAuthenticated={!!user}
          defaultName={user?.displayName ?? [user?.firstName, user?.lastName].filter(Boolean).join(" ") ?? ""}
          defaultEmail={user?.email ?? ""}
          defaultPhone={user?.phone ?? ""}
          defaultPreferredContact={user?.preferredContact ?? undefined}
        />
      </div>
    </div>
  );
}
