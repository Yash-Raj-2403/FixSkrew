import { useEffect, useState } from "react";

function useMedia(query: string): boolean {
  const [matches, setMatches] = useState(() => typeof window !== "undefined" && window.matchMedia(query).matches);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);
  return matches;
}

export const usePrefersReducedMotion = () => useMedia("(prefers-reduced-motion: reduce)");
export const useIsCompact = () => useMedia("(max-width: 767px)");
export const useCoarsePointer = () => useMedia("(pointer: coarse)");
