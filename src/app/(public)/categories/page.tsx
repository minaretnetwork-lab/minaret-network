export const dynamic = "force-dynamic";

import Link from "next/link";
import { CategoryIcon } from "@/components/ui/category-icon";
import { CATEGORIES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { DEFAULT_MOSQUE_SLUG } from "@/lib/constants";

export const metadata = { title: "Browse Categories" };

export default async function CategoriesPage() {
  const mosque = await prisma.mosque.findUnique({
    where: { slug: DEFAULT_MOSQUE_SLUG },
    include: {
      categories: {
        where: { isActive: true },
        include: { _count: { select: { professionals: { where: { status: "APPROVED" } } } } },
        orderBy: { name: "asc" },
      },
    },
  });

  const countBySlug = Object.fromEntries(
    (mosque?.categories ?? []).map((c) => [c.slug, c._count.professionals])
  );

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">All Categories</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Browse all {CATEGORIES.length} professional categories
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {CATEGORIES.map((cat) => {
          const count = countBySlug[cat.slug] ?? 0;
          return (
            <Link
              key={cat.slug}
              href={`/professionals?category=${cat.slug}`}
              className="group flex flex-col items-center gap-2.5 p-5 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-900/10 hover:shadow-sm transition-all duration-200 text-center"
            >
              <CategoryIcon slug={cat.slug} className="h-8 w-8 text-gray-500 dark:text-gray-400 group-hover:text-green-700 dark:group-hover:text-green-400 transition-colors" />
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200 group-hover:text-green-700 dark:group-hover:text-green-400 leading-tight">
                {cat.name}
              </span>
              {count > 0 && (
                <span className="text-xs text-gray-400">{count} professional{count !== 1 ? "s" : ""}</span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
