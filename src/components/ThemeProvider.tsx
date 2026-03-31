"use client";

import { useEffect } from "react";
import { useSettings } from "@/hooks/useSettings";

function applyTheme(theme: string) {
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
  } else if (theme === "light") {
    root.classList.remove("dark");
  } else {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.classList.toggle("dark", prefersDark);
  }
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { settings } = useSettings();

  useEffect(() => {
    const theme = settings.theme || "system";
    applyTheme(theme);

    if (theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () => applyTheme("system");
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
  }, [settings.theme]);

  return <>{children}</>;
}

/**
 * Inline script to prevent FOUC — runs before React hydration.
 * Injected in layout.tsx via dangerouslySetInnerHTML.
 */
export const themeInitScript = `
(function(){
  try {
    var s = localStorage.getItem('lii-settings');
    var t = s ? JSON.parse(s).theme : 'system';
    var d = t === 'dark' || (t !== 'light' && window.matchMedia('(prefers-color-scheme:dark)').matches);
    if (d) document.documentElement.classList.add('dark');
  } catch(e){}
})();
`;
