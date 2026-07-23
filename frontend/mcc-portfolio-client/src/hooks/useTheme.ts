/**
 * useTheme — global theme hook for MCC Portfolio Platform
 *
 * Stores the theme in localStorage under "mcc-theme".
 * Applies/removes the `dark` class on <html> so Tailwind dark: variants work.
 * Syncs across tabs via the storage event.
 */

"use client";

import { useEffect, useState } from "react";

const THEME_KEY = "mcc-theme";

export type ThemeMode = "dark" | "light";

function applyTheme(mode: ThemeMode) {
  if (typeof document === "undefined") return;
  if (mode === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}

export function useTheme(): [ThemeMode, () => void] {
  const [themeMode, setThemeMode] = useState<ThemeMode>("light");

  // On mount: read saved preference
  useEffect(() => {
    const saved = (localStorage.getItem(THEME_KEY) as ThemeMode) || "light";
    setThemeMode(saved);
    applyTheme(saved);
  }, []);

  // Sync across tabs
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === THEME_KEY && e.newValue) {
        const mode = e.newValue as ThemeMode;
        setThemeMode(mode);
        applyTheme(mode);
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const toggleThemeMode = () => {
    setThemeMode((prev) => {
      const next: ThemeMode = prev === "light" ? "dark" : "light";
      localStorage.setItem(THEME_KEY, next);
      applyTheme(next);
      return next;
    });
  };

  return [themeMode, toggleThemeMode];
}
