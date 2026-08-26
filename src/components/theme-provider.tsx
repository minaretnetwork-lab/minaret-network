"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

type Theme = "light" | "dark" | "system";

const ThemeContext = createContext<{
  theme: Theme;
  setTheme: (t: Theme) => void;
}>({ theme: "system", setTheme: () => {} });

export function useTheme() { return useContext(ThemeContext); }

function applyTheme(theme: Theme) {
  const dark =
    theme === "dark" ||
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");

  // Read from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("mn-theme") as Theme | null;
    const t = stored ?? "system";
    setThemeState(t);
    applyTheme(t);
  }, []);

  // Listen to OS preference changes (only relevant in system mode)
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    function onChange() {
      setThemeState((current) => { applyTheme(current); return current; });
    }
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const setTheme = useCallback((t: Theme) => {
    localStorage.setItem("mn-theme", t);
    setThemeState(t);
    applyTheme(t);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
