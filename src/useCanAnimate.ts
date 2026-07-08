import { useEffect, useState } from 'react';

export interface UseCanAnimateOptions {
  animate?: boolean;
  respectReducedMotion?: boolean;
}

export function useCanAnimate({
  animate = true,
  respectReducedMotion = true,
}: UseCanAnimateOptions = {}) {
  const [canUseDOM, setCanUseDOM] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    setCanUseDOM(true);

    if (typeof window === 'undefined' || !window.matchMedia) return undefined;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return animate && canUseDOM && !(respectReducedMotion && prefersReducedMotion);
}
