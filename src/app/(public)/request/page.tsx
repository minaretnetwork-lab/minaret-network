export const dynamic = "force-dynamic";

import { ServiceRequestForm } from "@/components/service-request-form";
import { prisma } from "@/lib/prisma";
import { CATEGORIES, DEFAULT_MOSQUE_SLUG } from "@/lib/constants";
import { getCurrentUser } from "@/lib/actions/auth";

export const metadata = { title: "Service Request" };

export default async function RequestPage() {
  const [user, mosque, dbCategories, approvedProfessionals] = await Promise.all([
    getCurrentUser().catch(() => null),
    prisma.mosque.findUnique({
      where: { slug: DEFAULT_MOSQUE_SLUG },
      select: { serviceAreas: { orderBy: { name: "asc" } } },
    }),
    // Fetch DB categories only for IDs and regulated-profession flag; list order comes from static CATEGORIES
    prisma.category.findMany({
      select: { id: true, slug: true, isRegulatedProfession: true },
    }),
    prisma.professional.findMany({
      where: { status: "APPROVED" },
      select: {
        category: { select: { slug: true } },
        categories: { select: { slug: true } },
      },
    }),
  ]);

  // Use static CATEGORIES as the source of truth (matches categories page)
  const dbBySlug = Object.fromEntries(dbCategories.map((c) => [c.slug, c]));
  const allCategories = CATEGORIES
    .filter((c) => dbBySlug[c.slug])
    .map((c) => ({
      id: dbBySlug[c.slug].id,
      name: c.name,
      slug: c.slug,
      icon: c.icon,
      isRegulatedProfession: dbBySlug[c.slug].isRegulatedProfession,
    }));

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
          categories={allCategories.map((category) => ({
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
