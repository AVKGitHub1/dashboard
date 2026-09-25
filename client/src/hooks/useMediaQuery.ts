import { useEffect, useState } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    // Re-read on mount too: the query can already have flipped between the initial
    // render and this effect (rotating the device during hydration, a resized window).
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

/** Phone-width layout. Kept in sync with Tailwind's `md` breakpoint and index.css. */
export const useIsMobile = () => useMediaQuery('(max-width: 767px)');

/**
 * Finger vs. mouse — deliberately not the same question as "is this a phone". A
 * touchscreen laptop reports both kinds of pointer and should keep its hover
 * affordances; `hover: none` is what actually tells us hover-reveal UI is unreachable.
 */
export const useIsTouch = () => useMediaQuery('(hover: none) and (pointer: coarse)');
