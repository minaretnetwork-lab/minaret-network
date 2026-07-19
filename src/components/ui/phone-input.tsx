"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const COUNTRY_CODES = [
  { code: "+1",   flag: "🇨🇦", name: "Canada" },
  { code: "+1",   flag: "🇺🇸", name: "USA" },
  { code: "+92",  flag: "🇵🇰", name: "Pakistan" },
  { code: "+91",  flag: "🇮🇳", name: "India" },
  { code: "+880", flag: "🇧🇩", name: "Bangladesh" },
  { code: "+20",  flag: "🇪🇬", name: "Egypt" },
  { code: "+966", flag: "🇸🇦", name: "Saudi Arabia" },
  { code: "+971", flag: "🇦🇪", name: "UAE" },
  { code: "+974", flag: "🇶🇦", name: "Qatar" },
  { code: "+965", flag: "🇰🇼", name: "Kuwait" },
  { code: "+44",  flag: "🇬🇧", name: "UK" },
  { code: "+252", flag: "🇸🇴", name: "Somalia" },
  { code: "+234", flag: "🇳🇬", name: "Nigeria" },
  { code: "+213", flag: "🇩🇿", name: "Algeria" },
  { code: "+212", flag: "🇲🇦", name: "Morocco" },
  { code: "+216", flag: "🇹🇳", name: "Tunisia" },
  { code: "+90",  flag: "🇹🇷", name: "Turkey" },
  { code: "+98",  flag: "🇮🇷", name: "Iran" },
  { code: "+964", flag: "🇮🇶", name: "Iraq" },
  { code: "+963", flag: "🇸🇾", name: "Syria" },
  { code: "+961", flag: "🇱🇧", name: "Lebanon" },
  { code: "+962", flag: "🇯🇴", name: "Jordan" },
  { code: "+249", flag: "🇸🇩", name: "Sudan" },
  { code: "+60",  flag: "🇲🇾", name: "Malaysia" },
  { code: "+62",  flag: "🇮🇩", name: "Indonesia" },
];

interface PhoneInputProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
}

function parsePhone(full: string): { idx: number; number: string } {
  for (const c of [...COUNTRY_CODES].sort((a, b) => b.code.length - a.code.length)) {
    if (full.startsWith(c.code + " ") || full.startsWith(c.code)) {
      const idx = COUNTRY_CODES.findIndex((x) => x.code === c.code && x.name === c.name);
      return { idx: idx >= 0 ? idx : 0, number: full.slice(c.code.length).trim() };
    }
  }
  return { idx: 0, number: full };
}

export function PhoneInput({ value = "", onChange, placeholder = "416 555 0000", className, id }: PhoneInputProps) {
  const parsed = parsePhone(value);
  const [selectedIdx, setSelectedIdx] = useState(parsed.idx);
  const [number, setNumber] = useState(parsed.number);

  const country = COUNTRY_CODES[selectedIdx];

  function handleIdxChange(idx: number) {
    setSelectedIdx(idx);
    onChange?.(`${COUNTRY_CODES[idx].code} ${number}`.trim());
  }

  function handleNumberChange(e: React.ChangeEvent<HTMLInputElement>) {
    const n = e.target.value;
    setNumber(n);
    onChange?.(`${country.code} ${n}`.trim());
  }

  return (
    <div className={cn("flex gap-2", className)}>
      <select
        value={selectedIdx}
        onChange={(e) => handleIdxChange(Number(e.target.value))}
        className="flex-shrink-0 w-28 border border-gray-300 dark:border-gray-700 rounded-lg px-2 py-2 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
        aria-label="Country code"
      >
        {COUNTRY_CODES.map((c, i) => (
          <option key={i} value={i}>
            {c.flag} {c.code}
          </option>
        ))}
      </select>
      <input
        id={id}
        type="tel"
        value={number}
        onChange={handleNumberChange}
        placeholder={placeholder}
        className="flex-1 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        aria-label="Phone number"
      />
    </div>
  );
}
