"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";

type AddressSuggestion = { label: string; address: string; city: string | null; province: string | null };

interface AddressAutocompleteInputProps {
  name: string;
  defaultValue?: string;
  placeholder?: string;
}

export function AddressAutocompleteInput({ name, defaultValue = "", placeholder }: AddressAutocompleteInputProps) {
  const [value, setValue] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    const query = value.trim();
    if (query.length < 3) { setSuggestions([]); setLoading(false); return; }
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/geocode/search?q=${encodeURIComponent(query)}`);
        const data = await res.json() as { suggestions?: AddressSuggestion[] };
        setSuggestions(data.suggestions ?? []);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [value]);

  return (
    <div ref={ref} className="relative">
      <Input
        name={name}
        value={value}
        onChange={(e) => { setValue(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder ?? "Start typing an address, e.g. 123 Main St, Newmarket"}
        autoComplete="street-address"
      />
      {open && value.trim().length >= 3 && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-64 overflow-auto rounded-xl border border-gray-200 bg-white p-1 shadow-lg dark:border-gray-700 dark:bg-gray-900">
          {loading ? (
            <p className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">Looking up addresses…</p>
          ) : suggestions.length > 0 ? (
            suggestions.map((s) => (
              <button
                key={`${s.address}-${s.label}`}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { setValue(s.address); setOpen(false); }}
                className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-emerald-50 focus:bg-emerald-50 focus:outline-none dark:hover:bg-emerald-900/20"
              >
                <span className="block font-medium text-gray-900 dark:text-white">{s.address}</span>
                {(s.city || s.province) && (
                  <span className="block text-xs text-gray-500 dark:text-gray-400">
                    {[s.city, s.province].filter(Boolean).join(", ")}
                  </span>
                )}
              </button>
            ))
          ) : (
            <p className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
              No matching address found. You can still type it manually.
            </p>
          )}
        </div>
      )}
      <p className="mt-1 text-xs text-gray-400">Suggestions use free OpenStreetMap data. You can always type manually.</p>
    </div>
  );
}
