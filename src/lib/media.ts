import { useSyncExternalStore } from "react";

/** Live `matchMedia` result. Used where the desktop layout needs different markup, not just different CSS. */
export function useMedia(query: string) {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

export const useDesktop = () => useMedia("(min-width: 1024px)");
