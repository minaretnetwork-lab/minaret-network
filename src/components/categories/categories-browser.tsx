"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { CategoryIcon } from "@/components/ui/category-icon";

interface CategoryItem {
  name: string;
  slug: string;
  icon: string | null;
  professionalCount: number;
}

export function CategoriesBrowser({ categories }: { categories: CategoryItem[] }) {
  const [query, setQuery] = useState("");
  const [onlyWithProfessionals, setOnlyWithProfessionals] = useState(false);

  const filteredCategories = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return categories.filter((category) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        category.name.toLowerCase().includes(normalizedQuery);
      const matchesCount = !onlyWithProfessionals || category.professionalCount > 0;

      return matchesQuery && matchesCount;
    });
  }, [categories, onlyWithProfessionals, query]);

  return (
    <>
      <div className="mx-auto mb-8 max-w-2xl space-y-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search categories"
            className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-10 text-sm text-gray-900 placeholder:text-gray-400 transition focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div>
          <button
            type="button"
            onClick={() => setOnlyWithProfessionals((current) => !current)}
            aria-pressed={onlyWithProfessionals}
            className={`inline-flex items-center rounded-full border px-4 py-2 text-sm font-medium transition ${
              onlyWithProfessionals
                ? "border-emerald-500 bg-emerald-50 text-emerald-800 dark:border-emerald-400 dark:bg-emerald-900/20 dark:text-emerald-300"
                : "border-gray-200 bg-white text-gray-600 hover:border-emerald-300 hover:text-emerald-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-emerald-700 dark:hover:text-emerald-300"
            }`}
          >
            Show only categories with professionals
          </button>
        </div>
      </div>

      {filteredCategories.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 px-6 py-12 text-center text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400">
          No categories match your filters.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filteredCategories.map((category) => (
            <Link
              key={category.slug}
              href={`/professionals?category=${category.slug}`}
              className="group flex flex-col items-center gap-2.5 rounded-xl border border-gray-200 p-5 text-center transition-all duration-200 hover:border-green-400 hover:bg-green-50 hover:shadow-sm dark:border-gray-800 dark:hover:bg-green-900/10"
            >
              <CategoryIcon
                slug={category.slug}
                icon={category.icon}
                className="h-8 w-8 text-gray-500 transition-colors group-hover:text-green-700 dark:text-gray-400 dark:group-hover:text-green-400"
              />
              <span className="text-sm font-medium leading-tight text-gray-800 transition-colors group-hover:text-green-700 dark:text-gray-200 dark:group-hover:text-green-400">
                {category.name}
              </span>
              <span className="text-xs text-gray-400">
                {category.professionalCount} professional{category.professionalCount !== 1 ? "s" : ""}
              </span>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
