import { useEffect, useMemo, useState } from "react";

import type { FC, PropsWithChildren } from "react";

// contexts
import { ThemeContext } from "../contexts/theme.context";

// types
import type { ThemePreference as TThemePreference } from "../contexts/theme.context";

type TTheme = "light" | "dark";
type TThemeContext = {
  theme: TTheme;
  preference: TThemePreference;
  setPreference: (preference: TThemePreference) => void;
};

const THEME_STORAGE_KEY = "expenses-theme";

const getThemePreference = (): TThemePreference => {
  try {
    const storedPreference = localStorage.getItem(THEME_STORAGE_KEY);
    return storedPreference === "light" || storedPreference === "dark"
      ? storedPreference
      : "system";
  } catch {
    return "system";
  }
};

const getDeviceTheme = (): TTheme => {
  const mediaQuery: MediaQueryList = window.matchMedia("(prefers-color-scheme: dark)");

  return mediaQuery.matches ? "dark" : "light";
};

export const ThemeProvider: FC<PropsWithChildren> = ({ children }) => {
  const [preference, setPreference] = useState<TThemePreference>(getThemePreference);
  const [deviceTheme, setDeviceTheme] = useState<TTheme>(getDeviceTheme);
  const theme: TTheme = preference === "system" ? deviceTheme : preference;

  useEffect(() => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, preference);
    } catch {
      // Keep theme selection available when browser storage is disabled.
    }
  }, [preference]);

  useEffect(() => {
    const mediaQuery: MediaQueryList = window.matchMedia("(prefers-color-scheme: dark)");

    const handleThemeChange = (event: MediaQueryListEvent): void => {
      setDeviceTheme(event.matches ? "dark" : "light");
    };

    mediaQuery.addEventListener("change", handleThemeChange);

    return (): void => {
      mediaQuery.removeEventListener("change", handleThemeChange);
    };
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);

    document.documentElement.style.colorScheme = theme;

    // The phone's status bar follows the app's theme, not only the system one.
    for (const meta of document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')) {
      meta.content = theme === "dark" ? "#0c120e" : "#f8fdf8";
    }

  }, [theme]);

  const contextValue: TThemeContext = useMemo(
    (): TThemeContext => ({
      theme,
      preference,
      setPreference,
    }),
    [theme, preference],
  );

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>;
};
