import { useCallback, useEffect, useState } from "react";

export type ThemePreference = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

const STORAGE_KEY = "ag-theme";

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined" || !window.matchMedia) return "dark";
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function getStoredPreference(): ThemePreference {
  if (typeof localStorage === "undefined") return "system";
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === "light" || raw === "dark" || raw === "system") return raw;
  return "system";
}

function applyTheme(theme: ResolvedTheme) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.style.colorScheme = theme;
}

export function useTheme() {
  const [preference, setPreference] = useState<ThemePreference>(() => getStoredPreference());
  const [resolved, setResolved] = useState<ResolvedTheme>(() => {
    const pref = getStoredPreference();
    return pref === "system" ? getSystemTheme() : pref;
  });

  // Keep DOM in sync with the resolved theme.
  useEffect(() => {
    applyTheme(resolved);
  }, [resolved]);

  // React to OS theme changes when following the system preference.
  useEffect(() => {
    if (preference !== "system") return;
    const mql = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = (e: MediaQueryListEvent) => setResolved(e.matches ? "light" : "dark");
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [preference]);

  const changePreference = useCallback((next: ThemePreference) => {
    setPreference(next);
    if (next === "system") {
      setResolved(getSystemTheme());
    } else {
      setResolved(next);
    }
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore quota / privacy errors */
    }
  }, []);

  const cycle = useCallback(() => {
    setPreference((prev) => {
      const order: ThemePreference[] = ["system", "light", "dark"];
      const next = order[(order.indexOf(prev) + 1) % order.length];
      if (next === "system") {
        setResolved(getSystemTheme());
      } else {
        setResolved(next);
      }
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  return { preference, resolved, setPreference: changePreference, cycle };
}
