import { prisma } from "@/lib/prisma";
import { DEFAULT_MOSQUE_SLUG } from "@/lib/constants";
import { CATEGORIES } from "@/lib/constants";
import { CategoryIcon } from "@/components/ui/category-icon";

export const metadata = { title: "Manage Categories" };

export default async function AdminCategoriesPage() {
  const mosque = await prisma.mosque.findUnique({
    where: { slug: DEFAULT_MOSQUE_SLUG },
    include: {
      categories: {
        include: {
          _count: { select: { professionals: { where: { status: "APPROVED" } } } },
        },
        orderBy: { name: "asc" },
      },
    },
  });

  const categories = mosque?.categories ?? [];
  const seededSlugs = new Set(categories.map((c) => c.slug));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Categories</h1>

      {categories.length > 0 ? (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Category</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Professionals</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                    <CategoryIcon slug={cat.slug} className="inline h-3.5 w-3.5 mr-1 -mt-0.5" />{cat.name}
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                    {cat._count.professionals}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      cat.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                    }`}>
                      {cat.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl p-6 text-center">
          <p className="text-amber-800 dark:text-amber-300 font-medium mb-2">No categories seeded yet</p>
          <p className="text-sm text-amber-700 dark:text-amber-400">
            Run the database seed script to populate categories and service areas.
          </p>
          <pre className="mt-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg p-3 text-xs text-left text-amber-900 dark:text-amber-200">
            npx prisma db seed
          </pre>
        </div>
      )}

      {/* Show what will be seeded */}
      {categories.length === 0 && (
        <div>
          <h2 className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-3">Default Categories (25)</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {CATEGORIES.map((cat) => (
              <div key={cat.slug} className={`text-xs px-3 py-2 rounded-lg border ${
                seededSlugs.has(cat.slug)
                  ? "border-green-200 bg-green-50 text-green-700"
                  : "border-gray-200 bg-white text-gray-600 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400"
              }`}>
                <CategoryIcon slug={cat.slug} className="inline h-3.5 w-3.5 mr-1 -mt-0.5" />{cat.name}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
