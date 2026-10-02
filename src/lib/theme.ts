import { useCallback, useEffect, useState } from "react";
import { keys, store } from "./storage";

/** "lamp" is the stored value for Day mode (kept so saved preferences keep working). */
export type Theme = "night" | "lamp";
export type TextSize = "normal" | "large";

function apply(theme: Theme) {
  const root = document.documentElement;
  if (theme === "lamp") root.dataset.theme = "lamp";
  else delete root.dataset.theme;
  syncChrome();
}

function applyTextSize(size: TextSize) {
  const root = document.documentElement;
  if (size === "large") root.dataset.textsize = "large";
  else delete root.dataset.textsize;
}

// Keep the browser chrome in step with the page. We read the --bg token rather than
// hard-coding a colour, so the two can never drift apart.
function syncChrome() {
  const bg = getComputedStyle(document.documentElement).getPropertyValue("--bg").trim();
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta && bg) meta.setAttribute("content", `rgb(${bg})`);
}

/** The system's preference decides on a first visit. A saved choice always wins. */
function systemTheme(): Theme {
  try {
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "lamp" : "night";
  } catch {
    return "night";
  }
}

export function readTheme(): Theme {
  const saved = store.get<Theme>(keys.theme);
  return saved === "lamp" || saved === "night" ? saved : systemTheme();
}

export function readTextSize(): TextSize {
  return store.get<string>(keys.textsize) === "large" ? "large" : "normal";
}

/** Call before first render so there's no flash of the wrong theme or size. */
export function initTheme() {
  apply(readTheme());
  applyTextSize(readTextSize());
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(readTheme);
  const [textSize, setTextSizeState] = useState<TextSize>(readTextSize);

  useEffect(() => {
    apply(theme);
  }, [theme]);

  useEffect(() => {
    applyTextSize(textSize);
  }, [textSize]);

  // "Wipe everything" removes the stored preferences; go back to the defaults to match.
  useEffect(() => {
    const onChange = () => {
      if (store.get<Theme>(keys.theme) === null) setThemeState(systemTheme());
      if (store.get<string>(keys.textsize) === null) setTextSizeState("normal");
    };
    window.addEventListener("1am:change", onChange);
    return () => window.removeEventListener("1am:change", onChange);
  }, []);

  const setTheme = useCallback((next: Theme) => {
    store.set(keys.theme, next);
    setThemeState(next);
  }, []);

  const setTextSize = useCallback((next: TextSize) => {
    if (next === "large") store.set(keys.textsize, "large");
    else store.remove(keys.textsize);
    setTextSizeState(next);
  }, []);

  return { theme, setTheme, textSize, setTextSize };
}
