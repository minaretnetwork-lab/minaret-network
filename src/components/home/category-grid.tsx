import Link from "next/link";
import { CATEGORIES } from "@/lib/constants";

const FEATURED_CATEGORIES = CATEGORIES.slice(0, 12);

export function CategoryGrid() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
      {FEATURED_CATEGORIES.map((cat) => (
        <Link
          key={cat.slug}
          href={`/professionals?category=${cat.slug}`}
          className="group flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-900/10 hover:shadow-sm transition-all duration-200 text-center"
        >
          <span className="text-2xl">{cat.icon}</span>
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300 group-hover:text-green-700 dark:group-hover:text-green-400 leading-tight">
            {cat.name}
          </span>
        </Link>
      ))}
      <Link
        href="/categories"
        className="group flex flex-col items-center gap-2 p-4 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-900/10 transition-all duration-200 text-center"
      >
        <span className="text-2xl">+</span>
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 group-hover:text-green-700">
          All Categories
        </span>
      </Link>
    </div>
  );
}
