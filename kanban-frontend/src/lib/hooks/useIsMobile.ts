import { useState, useEffect } from 'react';

/**
 * Detects phones/tablets so expensive effects can be skipped on mobile without
 * altering desktop rendering.
 *
 * Matches a small viewport OR a coarse (touch) pointer, which reliably covers
 * phones and tablets while never matching a normal mouse-driven desktop.
 *
 * Returns `null` until the check has run on the client. Callers should treat
 * `null` as "unknown" and render the desktop-safe default (usually nothing),
 * so server output and first hydration match and desktop stays untouched.
 */
export function useIsMobile(
  query = '(max-width: 768px), (pointer: coarse)',
): boolean | null {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const mql = window.matchMedia(query);
    const update = () => setIsMobile(mql.matches);
    update();
    mql.addEventListener('change', update);
    return () => mql.removeEventListener('change', update);
  }, [query]);

  return isMobile;
}
