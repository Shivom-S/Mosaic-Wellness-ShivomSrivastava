import { useCallback, useEffect, useState } from "react";
import { keys, store } from "./storage";

export type Theme = "night" | "lamp";

function apply(theme: Theme) {
  const root = document.documentElement;
  if (theme === "lamp") root.dataset.theme = "lamp";
  else delete root.dataset.theme;

  // Keep the browser chrome in step with the page. We read the --bg token rather than
  // hard-coding a colour, so the two can never drift apart.
  const bg = getComputedStyle(root).getPropertyValue("--bg").trim();
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta && bg) meta.setAttribute("content", `rgb(${bg})`);
}

export function readTheme(): Theme {
  return store.get<Theme>(keys.theme) === "lamp" ? "lamp" : "night";
}

/** Call before first render so there's no flash of the wrong theme. */
export function initTheme() {
  apply(readTheme());
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(readTheme);

  useEffect(() => {
    apply(theme);
  }, [theme]);

  // "Wipe everything" removes the stored theme; go back to night to match.
  useEffect(() => {
    const onChange = () => {
      const stored = store.get<Theme>(keys.theme);
      if (stored === null) setThemeState((t) => (t === "night" ? t : "night"));
    };
    window.addEventListener("1am:change", onChange);
    return () => window.removeEventListener("1am:change", onChange);
  }, []);

  const toggle = useCallback(() => {
    setThemeState((t) => {
      const next: Theme = t === "night" ? "lamp" : "night";
      store.set(keys.theme, next);
      return next;
    });
  }, []);

  return { theme, toggle };
}
