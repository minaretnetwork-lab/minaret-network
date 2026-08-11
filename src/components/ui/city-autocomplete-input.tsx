"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MapPin, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type CitySuggestion = {
  label: string;
  slug?: string;
  id?: string;
};

interface CityAutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (suggestion: CitySuggestion) => void;
  suggestions?: CitySuggestion[];
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  clearable?: boolean;
}

export function CityAutocompleteInput({
  value,
  onChange,
  onSelect,
  suggestions,
  placeholder = "City or area",
  className,
  inputClassName,
  clearable = true,
}: CityAutocompleteInputProps) {
  const [remoteSuggestions, setRemoteSuggestions] = useState<CitySuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const query = value.trim().toLowerCase();
  const filteredSuggestions = suggestions
    ? suggestions
        .filter((suggestion) => suggestion.label.toLowerCase().includes(query))
        .slice(0, 8)
    : remoteSuggestions;

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const fetchRemoteSuggestions = useCallback((nextValue: string) => {
    if (suggestions) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (nextValue.trim().length < 2) {
      setRemoteSuggestions([]);
      setOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/suggestions?type=location&q=${encodeURIComponent(nextValue)}`);
        const payload = await response.json() as Array<{ label: string; slug?: string }>;
        setRemoteSuggestions(payload);
        setOpen(payload.length > 0);
        setActiveIndex(-1);
      } catch {
        setRemoteSuggestions([]);
      }
    }, 180);
  }, [suggestions]);

  function handleChange(nextValue: string) {
    onChange(nextValue);
    if (suggestions) {
      setOpen(nextValue.trim().length > 0);
      setActiveIndex(-1);
      return;
    }
    fetchRemoteSuggestions(nextValue);
  }

  function selectSuggestion(suggestion: CitySuggestion) {
    onChange(suggestion.label);
    onSelect?.(suggestion);
    setOpen(false);
    setActiveIndex(-1);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || filteredSuggestions.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, filteredSuggestions.length - 1));
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, -1));
    }
    if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      selectSuggestion(filteredSuggestions[activeIndex]);
    }
    if (event.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  }

  return (
    <div ref={wrapperRef} className={cn("relative", className)}>
      <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <Input
        value={value}
        onChange={(event) => handleChange(event.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => value.trim().length > 0 && filteredSuggestions.length > 0 && setOpen(true)}
        placeholder={placeholder}
        autoComplete="off"
        className={cn("h-10 bg-white pl-9 pr-9 dark:bg-gray-950", inputClassName)}
      />
      {clearable && value && (
        <button
          type="button"
          onClick={() => {
            onChange("");
            onSelect?.({ label: "" });
            setOpen(false);
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-600"
          aria-label="Clear city"
        >
          <X className="h-4 w-4" />
        </button>
      )}

      {open && filteredSuggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900">
          {filteredSuggestions.map((suggestion, index) => (
            <button
              key={`${suggestion.id ?? suggestion.slug ?? suggestion.label}-${index}`}
              type="button"
              onMouseDown={(event) => {
                event.preventDefault();
                selectSuggestion(suggestion);
              }}
              className={cn(
                "flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors",
                index === activeIndex
                  ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300"
                  : "text-gray-800 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"
              )}
            >
              <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
              <span>{suggestion.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
