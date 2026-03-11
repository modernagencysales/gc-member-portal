/**
 * useScrollReveal. IntersectionObserver hook that triggers a visibility transition when an element scrolls into view.
 * Constraint: Pure UI — no data fetching. Respects prefers-reduced-motion.
 */
import { useEffect, useRef, useState } from 'react';

export function useScrollReveal(options: { threshold?: number; rootMargin?: string } = {}) {
  const { threshold = 0.15, rootMargin = '0px 0px -60px 0px' } = options;
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setIsVisible(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold, rootMargin }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  return { ref, isVisible };
}
