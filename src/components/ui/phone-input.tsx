"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const COUNTRY_CODES = [
  { code: "+1", flag: "🇨🇦", name: "Canada" },
  { code: "+1", flag: "🇺🇸", name: "USA" },
  { code: "+92", flag: "🇵🇰", name: "Pakistan" },
  { code: "+91", flag: "🇮🇳", name: "India" },
  { code: "+880", flag: "🇧🇩", name: "Bangladesh" },
  { code: "+20", flag: "🇪🇬", name: "Egypt" },
  { code: "+966", flag: "🇸🇦", name: "Saudi Arabia" },
  { code: "+971", flag: "🇦🇪", name: "UAE" },
  { code: "+974", flag: "🇶🇦", name: "Qatar" },
  { code: "+965", flag: "🇰🇼", name: "Kuwait" },
  { code: "+44", flag: "🇬🇧", name: "UK" },
  { code: "+252", flag: "🇸🇴", name: "Somalia" },
  { code: "+234", flag: "🇳🇬", name: "Nigeria" },
  { code: "+213", flag: "🇩🇿", name: "Algeria" },
  { code: "+212", flag: "🇲🇦", name: "Morocco" },
  { code: "+216", flag: "🇹🇳", name: "Tunisia" },
  { code: "+90", flag: "🇹🇷", name: "Turkey" },
  { code: "+98", flag: "🇮🇷", name: "Iran" },
  { code: "+964", flag: "🇮🇶", name: "Iraq" },
  { code: "+963", flag: "🇸🇾", name: "Syria" },
  { code: "+961", flag: "🇱🇧", name: "Lebanon" },
  { code: "+962", flag: "🇯🇴", name: "Jordan" },
  { code: "+249", flag: "🇸🇩", name: "Sudan" },
  { code: "+60", flag: "🇲🇾", name: "Malaysia" },
  { code: "+62", flag: "🇮🇩", name: "Indonesia" },
];

interface PhoneInputProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
}

function parsePhone(full: string): { countryCode: string; number: string } {
  for (const c of [...COUNTRY_CODES].sort((a, b) => b.code.length - a.code.length)) {
    if (full.startsWith(c.code + " ") || full.startsWith(c.code)) {
      return { countryCode: c.code, number: full.slice(c.code.length).trim() };
    }
  }
  return { countryCode: "+1", number: full };
}

export function PhoneInput({ value = "", onChange, placeholder = "416 555 0000", className, id }: PhoneInputProps) {
  const parsed = parsePhone(value);
  const [countryCode, setCountryCode] = useState(parsed.countryCode);
  const [number, setNumber] = useState(parsed.number);

  function handleCodeChange(code: string) {
    setCountryCode(code);
    onChange?.(`${code} ${number}`.trim());
  }

  function handleNumberChange(e: React.ChangeEvent<HTMLInputElement>) {
    const n = e.target.value;
    setNumber(n);
    onChange?.(`${countryCode} ${n}`.trim());
  }

  const selectedCountry = COUNTRY_CODES.find((c) => c.code === countryCode) ?? COUNTRY_CODES[0];

  return (
    <div className={cn("flex gap-2", className)}>
      <select
        value={countryCode}
        onChange={(e) => handleCodeChange(e.target.value)}
        className="flex-shrink-0 w-32 border border-gray-300 dark:border-gray-700 rounded-lg px-2 py-2 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        aria-label="Country code"
      >
        {COUNTRY_CODES.map((c, i) => (
          <option key={`${c.code}-${i}`} value={c.code}>
            {c.flag} {c.code} {c.name}
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
