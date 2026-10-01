import { useCallback, useEffect, useState } from "react";
import { keys, store } from "./storage";

/** "lamp" is the stored value for Day mode (kept so saved preferences keep working). */
export type Theme = "night" | "lamp";

function apply(theme: Theme) {
  const root = document.documentElement;
  if (theme === "lamp") root.dataset.theme = "lamp";
  else delete root.dataset.theme;
  syncChrome();
}

function applyComfort(on: boolean) {
  const root = document.documentElement;
  if (on) root.dataset.comfort = "on";
  else delete root.dataset.comfort;
  syncChrome();
}

// Keep the browser chrome in step with the page. We read the --bg token rather than
// hard-coding a colour, so the two can never drift apart.
function syncChrome() {
  const bg = getComputedStyle(document.documentElement).getPropertyValue("--bg").trim();
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta && bg) meta.setAttribute("content", `rgb(${bg})`);
}

export function readTheme(): Theme {
  return store.get<Theme>(keys.theme) === "lamp" ? "lamp" : "night";
}

export function readComfort(): boolean {
  return store.get<string>(keys.comfort) === "on";
}

/** Call before first render so there's no flash of the wrong theme. */
export function initTheme() {
  apply(readTheme());
  applyComfort(readComfort());
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(readTheme);
  const [comfort, setComfortState] = useState<boolean>(readComfort);

  useEffect(() => {
    apply(theme);
  }, [theme]);

  useEffect(() => {
    applyComfort(comfort);
  }, [comfort]);

  // "Wipe everything" removes the stored preferences; go back to the defaults to match.
  useEffect(() => {
    const onChange = () => {
      if (store.get<Theme>(keys.theme) === null) setThemeState("night");
      if (store.get<string>(keys.comfort) === null) setComfortState(false);
    };
    window.addEventListener("1am:change", onChange);
    return () => window.removeEventListener("1am:change", onChange);
  }, []);

  const setTheme = useCallback((next: Theme) => {
    store.set(keys.theme, next);
    setThemeState(next);
  }, []);

  const setComfort = useCallback((on: boolean) => {
    if (on) store.set(keys.comfort, "on");
    else store.remove(keys.comfort);
    setComfortState(on);
  }, []);

  return { theme, setTheme, comfort, setComfort };
}
