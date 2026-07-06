"use client";

import { useEffect, useState } from "react";

/**
 * SSR-safe media-query hook. Starts false on the server / first paint, then
 * reflects the real match after mount. Used only for UI-behavior branches that
 * CSS can't express (e.g. does a roster row open the desktop slide-in pane, or
 * navigate to the full-page record?). Never used for identity or data.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);
  return matches;
}

/** True at the desktop tier (xl = 1280px+) where reflow-and-expand kicks in. */
export function useIsDesktop(): boolean {
  return useMediaQuery("(min-width: 1280px)");
}
