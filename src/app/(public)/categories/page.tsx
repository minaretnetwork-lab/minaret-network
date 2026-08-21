export const dynamic = "force-dynamic";

import { CategoriesBrowser } from "@/components/categories/categories-browser";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Browse Categories" };

export default async function CategoriesPage() {
  const [dbCategories, approved] = await Promise.all([
    prisma.category.findMany({
      where: { isActive: true },
      select: { id: true, name: true, slug: true, icon: true },
      orderBy: { name: "asc" },
    }),
    prisma.professional.findMany({
      where: { status: "APPROVED" },
      select: {
        category: { select: { slug: true } },
        categories: { select: { slug: true } },
      },
    }),
  ]);

  const countBySlug: Record<string, number> = {};
  for (const p of approved) {
    const slugs = new Set<string>();
    if (p.category?.slug) slugs.add(p.category.slug);
    for (const c of p.categories) slugs.add(c.slug);
    for (const slug of slugs) {
      countBySlug[slug] = (countBySlug[slug] ?? 0) + 1;
    }
  }

  const categories = dbCategories.map((cat) => ({
    name: cat.name,
    slug: cat.slug,
    icon: cat.icon ?? "🏷️",
    professionalCount: countBySlug[cat.slug] ?? 0,
  }));

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">All Categories</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Browse all {categories.length} professional categories
        </p>
      </div>

      <CategoriesBrowser categories={categories} />
    </div>
  );
}
