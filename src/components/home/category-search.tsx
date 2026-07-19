"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, X, ArrowRight } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
}

export function CategorySearch({ categories }: { categories: Category[] }) {
  const [query, setQuery] = useState("");

  const filtered = query.trim()
    ? categories.filter((c) =>
        c.name.toLowerCase().includes(query.toLowerCase())
      )
    : categories;

  return (
    <div>
      {/* Search input */}
      <div className="relative mb-5">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type a profession to filter…"
          className="w-full max-w-sm pl-10 pr-9 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            aria-label="Clear"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Chips */}
      {filtered.length === 0 ? (
        <p className="text-sm text-gray-400 py-4">
          No categories match &ldquo;{query}&rdquo;
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {filtered.map((cat) => (
            <Link
              key={cat.slug}
              href={`/professionals?category=${cat.slug}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-600 dark:text-gray-300 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:border-emerald-700 dark:hover:bg-emerald-900/20 dark:hover:text-emerald-400 transition-all"
            >
              {cat.icon && <span className="text-base leading-none">{cat.icon}</span>}
              {cat.name}
            </Link>
          ))}
          {!query && (
            <Link
              href="/categories"
              className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full border border-dashed border-gray-200 dark:border-gray-700 text-sm text-gray-400 hover:text-emerald-600 hover:border-emerald-300 dark:hover:text-emerald-400 transition-all"
            >
              All categories <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
