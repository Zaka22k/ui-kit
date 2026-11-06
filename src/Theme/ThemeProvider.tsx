"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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

export interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  accent: AccentColor;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setAccent: (accent: AccentColor) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export interface ThemeProviderProps {
  children: React.ReactNode;
  /** Тема, прочитанная сервером из cookie */
  initialTheme?: Theme;
  /** Акцент, прочитанный сервером из cookie */
  initialAccent?: AccentColor;
}

const DEFAULT_THEME: Theme = "light";
const DEFAULT_ACCENT: AccentColor = "green";

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
}

function isSystemAccent(value: string): value is SystemAccent {
  return (SYSTEM_ACCENTS as readonly string[]).includes(value);
}

/**
 * A system accent or any CSS colour the browser understands. Where the colour
 * cannot be checked (no CSS.supports, for example on the server), it is accepted.
 * Системный акцент или любой CSS-цвет, который понимает браузер. Там, где цвет
 * проверить нельзя (нет CSS.supports, например на сервере), он принимается.
 */
function isValidAccent(value: string): boolean {
  if (isSystemAccent(value)) return true;
  if (typeof CSS === "undefined" || typeof CSS.supports !== "function") {
    return true;
  }
  return value.trim() !== "" && CSS.supports("color", value);
}

function setCookie(name: string, value: string) {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=31536000; SameSite=Lax${secure}`;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  initialTheme = DEFAULT_THEME,
  initialAccent = DEFAULT_ACCENT,
}) => {
  const [theme, setThemeState] = useState<Theme>(initialTheme);
  const [accent, setAccentState] = useState<AccentColor>(initialAccent);
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(getSystemTheme);

  // Значения, с которыми cookie уже согласованы: пришедшие с сервера или записанные нами.
  // Cookie пишется только при их отличии, то есть после выбора пользователя, а не при монтировании.
  const synced = useRef({ theme: initialTheme, accent: initialAccent });

  // Следим за сменой системной темы для режима 'auto'
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: light)");
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? "light" : "dark");
    };
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Установка data-theme на html и запись куки при смене темы
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
    if (synced.current.theme !== theme) {
      synced.current.theme = theme;
      setCookie("app-theme", theme);
    }
  }, [theme]);

  // Установка data-accent на html и запись куки при смене акцента
  useEffect(() => {
    // Невалидный цвет (например, испорченная cookie) заменяется акцентом по умолчанию
    if (!isValidAccent(accent)) {
      setAccentState(DEFAULT_ACCENT);
      return;
    }

    const root = document.documentElement;
    if (isSystemAccent(accent)) {
      root.setAttribute("data-accent", accent);
      root.style.removeProperty("--accent-base");
    } else {
      root.setAttribute("data-accent", "custom");
      root.style.setProperty("--accent-base", accent);
    }

    if (synced.current.accent !== accent) {
      synced.current.accent = accent;
      setCookie("app-accent", accent);
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
    if (!isValidAccent(newAccent)) {
      console.warn(
        `ThemeProvider: "${newAccent}" не является CSS-цветом, акцент не изменён`,
      );
      return;
    }
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
