"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import "./theme.css";
import "../styles/tokens.css";

export type Theme = "light" | "dark" | "auto";
export type ResolvedTheme = "light" | "dark";

export const SYSTEM_ACCENTS = [
  "red",
  "orange",
  "yellow",
  "green",
  "mint",
  "teal",
  "cyan",
  "blue",
  "indigo",
  "purple",
  "pink",
  "brown",
  "gray",
] as const;

export type SystemAccent = (typeof SYSTEM_ACCENTS)[number];
export type AccentColor = SystemAccent | (string & {});

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  accent: AccentColor;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setAccent: (accent: AccentColor) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  /** Тема, прочитанная сервером из cookie */
  initialTheme?: Theme;
  /** Акцент, прочитанный сервером из cookie */
  initialAccent?: AccentColor;
}

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
}

function isSystemAccent(value: string): value is SystemAccent {
  return (SYSTEM_ACCENTS as readonly string[]).includes(value);
}

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=31536000; SameSite=Lax`;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  initialTheme = "light",
  initialAccent = "green",
}) => {
  const [theme, setThemeState] = useState<Theme>(initialTheme);
  const [accent, setAccentState] = useState<AccentColor>(initialAccent);
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(getSystemTheme);

  // Следим за сменой системной темы для режима 'auto'
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: light)");
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? "light" : "dark");
    };
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Установка data-theme на html и запись куки
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
    setCookie("app-theme", theme);
  }, [theme]);

  // Установка data-accent на html и запись куки
  useEffect(() => {
    const root = document.documentElement;
    setCookie("app-accent", accent);

    if (isSystemAccent(accent)) {
      root.setAttribute("data-accent", accent);
      root.style.removeProperty("--accent-base");
    } else {
      root.setAttribute("data-accent", "custom");
      root.style.setProperty("--accent-base", accent);
    }
  }, [accent]);

  const resolvedTheme: ResolvedTheme = theme === "auto" ? systemTheme : theme;

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const current = prev === "auto" ? getSystemTheme() : prev;
      return current === "dark" ? "light" : "dark";
    });
  }, []);

  const setAccent = useCallback((newAccent: AccentColor) => {
    setAccentState(newAccent);
  }, []);

  const value = useMemo(
    () => ({
      theme,
      resolvedTheme,
      accent,
      setTheme,
      toggleTheme,
      setAccent,
    }),
    [theme, resolvedTheme, accent, setTheme, toggleTheme, setAccent],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme должен использоваться внутри ThemeProvider");
  }
  return context;
};
