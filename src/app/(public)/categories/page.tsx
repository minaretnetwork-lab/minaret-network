export const dynamic = "force-dynamic";

import { CategoriesBrowser } from "@/components/categories/categories-browser";
import { CATEGORIES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Browse Categories" };

export default async function CategoriesPage() {
  const categoryCounts = await prisma.category.findMany({
    where: { isActive: true },
    select: {
      slug: true,
      _count: { select: { professionals: { where: { status: "APPROVED" } } } },
    },
  });

  const countBySlug = Object.fromEntries(
    categoryCounts.map((c) => [c.slug, c._count.professionals])
  );

  const categories = [...CATEGORIES]
    .sort((left, right) => left.name.localeCompare(right.name))
    .map((category) => ({
      ...category,
      professionalCount: countBySlug[category.slug] ?? 0,
    }));

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">All Categories</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Browse all {CATEGORIES.length} professional categories
        </p>
      </div>

      <CategoriesBrowser categories={categories} />
    </div>
  );
}
