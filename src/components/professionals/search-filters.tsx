"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Filter, ChevronDown } from "lucide-react";
import { LANGUAGES } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface Category { slug: string; name: string; icon?: string | null }
interface ServiceArea { slug: string; name: string }

interface SearchFiltersProps {
  categories: Category[];
  serviceAreas: ServiceArea[];
}

export function SearchFilters({ categories, serviceAreas }: SearchFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page");
    router.push(`/professionals?${params.toString()}`);
  }

  function clearAll() {
    const q = searchParams.get("q");
    router.push(q ? `/professionals?q=${q}` : "/professionals");
    setMobileOpen(false);
  }

  const currentCategory = searchParams.get("category") ?? "";
  const currentArea = searchParams.get("area") ?? "";
  const currentLang = searchParams.get("lang") ?? "";
  const verifiedOnly = searchParams.get("verified") === "1";
  const sortBy = searchParams.get("sort") ?? "";

  const activeCount = [currentCategory, currentArea, currentLang, verifiedOnly ? "1" : "", sortBy]
    .filter(Boolean).length;
  const hasFilters = activeCount > 0;

  const filterBody = (
    <div className="space-y-5 pt-1">
      {/* Sort */}
      <div>
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Sort by</label>
        <select
          value={sortBy}
          onChange={(e) => updateFilter("sort", e.target.value)}
          className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="">Most Recommended</option>
          <option value="newest">Newest First</option>
          <option value="alphabetical">Alphabetical</option>
        </select>
      </div>

      {/* Category */}
      <div>
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Category</label>
        <select
          value={currentCategory}
          onChange={(e) => updateFilter("category", e.target.value)}
          className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>{c.icon} {c.name}</option>
          ))}
        </select>
      </div>

      {/* Service Area */}
      <div>
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Service area</label>
        <select
          value={currentArea}
          onChange={(e) => updateFilter("area", e.target.value)}
          className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="">All Areas</option>
          {serviceAreas.map((a) => (
            <option key={a.slug} value={a.slug}>{a.name}</option>
          ))}
        </select>
      </div>

      {/* Language */}
      <div>
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Language</label>
        <select
          value={currentLang}
          onChange={(e) => updateFilter("lang", e.target.value)}
          className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="">Any Language</option>
          {LANGUAGES.map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
      </div>

      {/* Verified only */}
      <label className="flex items-center gap-2.5 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={verifiedOnly}
          onChange={(e) => updateFilter("verified", e.target.checked ? "1" : "")}
          className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
        />
        <span className="text-sm text-gray-700 dark:text-gray-300">Mosque affiliated only</span>
      </label>

      {hasFilters && (
        <button onClick={clearAll} className="text-xs text-emerald-700 dark:text-emerald-400 hover:underline font-medium">
          Clear all filters
        </button>
      )}
    </div>
  );

  return (
    <>
      {/* ── Mobile: collapsible pill button ── */}
      <div className="lg:hidden">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium w-full justify-between transition-colors",
            mobileOpen || hasFilters
              ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-700"
              : "border-border bg-white dark:bg-white/5 text-gray-700 dark:text-gray-300"
          )}
        >
          <span className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
            {activeCount > 0 && (
              <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                {activeCount}
              </span>
            )}
          </span>
          <ChevronDown className={cn("h-4 w-4 text-gray-400 transition-transform duration-200", mobileOpen && "rotate-180")} />
        </button>

        <div className={cn(
          "overflow-hidden transition-all duration-200",
          mobileOpen ? "max-h-[600px] mt-3" : "max-h-0"
        )}>
          <div className="bg-white dark:bg-gray-900 border border-border rounded-xl p-5">
            {filterBody}
          </div>
        </div>
      </div>

      {/* ── Desktop: always-visible sidebar ── */}
      <div className="hidden lg:block bg-white dark:bg-white/[0.03] border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white" style={{ fontFamily: "var(--font-playfair)" }}>
            <Filter className="h-4 w-4 text-gray-400" />
            Filters
          </div>
          {hasFilters && (
            <button onClick={clearAll} className="text-xs text-emerald-700 dark:text-emerald-400 hover:underline font-medium">
              Clear all
            </button>
          )}
        </div>
        {filterBody}
      </div>
    </>
  );
}
