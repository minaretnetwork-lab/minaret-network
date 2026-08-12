"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type Suggestion = { label: string; type: "category" | "professional"; slug?: string };

export function SearchBar({ defaultValue = "" }: { defaultValue?: string }) {
  const [query, setQuery] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  const router = useRouter();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current && !inputRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const fetchSuggestions = useCallback((val: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.length < 2) { setSuggestions([]); setOpen(false); return; }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/suggestions?q=${encodeURIComponent(val)}`);
        const data: Suggestion[] = await res.json();
        setSuggestions(data);
        setOpen(data.length > 0);
        setActive(-1);
      } catch { /* ignore */ }
    }, 220);
  }, []);

  function handleChange(val: string) {
    setQuery(val);
    fetchSuggestions(val);
  }

  function navigate(q?: string, categorySlug?: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    if (categorySlug) {
      params.set("category", categorySlug);
      params.delete("q");
    } else if (q?.trim()) {
      params.set("q", q.trim());
      params.delete("category");
    } else {
      params.delete("q");
    }
    router.push(`/professionals?${params.toString()}`);
  }

  function selectSuggestion(s: Suggestion) {
    const cleanLabel = s.label.replace(/^.\s/, "");
    setQuery(s.type === "category" ? cleanLabel : s.label);
    setOpen(false);
    navigate(cleanLabel, s.type === "category" ? s.slug : undefined);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((i) => Math.min(i + 1, suggestions.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => Math.max(i - 1, -1)); }
    if (e.key === "Enter" && active >= 0) { e.preventDefault(); selectSuggestion(suggestions[active]); }
    if (e.key === "Escape") { setOpen(false); setActive(-1); }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setOpen(false);
    navigate(query);
  }

  function clearQuery() {
    setQuery("");
    setSuggestions([]);
    setOpen(false);
    navigate("");
    inputRef.current?.focus();
  }

  return (
    <form onSubmit={handleSubmit} className="relative flex gap-2 w-full">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder="Search"
          autoComplete="off"
          className="w-full h-11 pl-9 pr-8 rounded-lg text-sm border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        {query && (
          <button
            type="button"
            onClick={clearQuery}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}

        {/* Suggestions dropdown */}
        {open && suggestions.length > 0 && (
          <div
            ref={dropdownRef}
            className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden"
          >
            {suggestions.map((s, i) => (
              <button
                key={i}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); selectSuggestion(s); }}
                className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 transition-colors ${
                  i === active
                    ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300"
                    : "text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                <span className="text-gray-400 text-xs uppercase tracking-wide w-16 flex-shrink-0">
                  {s.type === "category" ? "Category" : "Pro"}
                </span>
                <span>{s.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <Button type="submit" className="h-11 bg-green-600 hover:bg-green-700 text-white px-5 flex-shrink-0">
        Search
      </Button>
    </form>
  );
}
