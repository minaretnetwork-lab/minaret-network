"use client";

import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "./theme-provider";

const OPTIONS = [
  { value: "light", icon: Sun,     label: "Light" },
  { value: "system", icon: Monitor, label: "System" },
  { value: "dark",  icon: Moon,    label: "Dark"  },
] as const;

export function ThemePicker({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  return (
    <div className={`flex items-center rounded-full bg-white/10 p-0.5 gap-0.5 ${className ?? ""}`}>
      {OPTIONS.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          type="button"
          aria-label={label}
          onClick={() => setTheme(value)}
          title={label}
          className={`flex items-center justify-center h-6 w-6 rounded-full transition-all ${
            theme === value
              ? "bg-white text-emerald-800 shadow-sm"
              : "text-white/60 hover:text-white"
          }`}
        >
          <Icon className="h-3.5 w-3.5" />
        </button>
      ))}
    </div>
  );
}
