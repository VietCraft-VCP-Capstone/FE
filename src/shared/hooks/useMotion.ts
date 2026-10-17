import { useRef, type DependencyList, type RefObject } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

export const MOTION_DURATION = 0.2;

export const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function useEnterMotion<T extends HTMLElement>(
  deps: DependencyList = [],
  { selector = ':scope > *', stagger = 0.03, y = 6 }: { selector?: string; stagger?: number; y?: number } = {},
): RefObject<T> {
  const ref = useRef<T>(null);
  useGSAP(
    () => {
      if (!ref.current || reducedMotion()) return;
      const targets = ref.current.querySelectorAll(selector);
      if (!targets.length) return;
      gsap.from(targets, { autoAlpha: 0, y, duration: MOTION_DURATION, stagger, ease: 'power2.out', clearProps: 'opacity,visibility,transform' });
    },
    { scope: ref, dependencies: [...deps] },
  );
  return ref;
}

export function useCountTo<T extends HTMLElement>(value: number | null, format: (n: number) => string): RefObject<T> {
  const ref = useRef<T>(null);
  const last = useRef<number | null>(null);
  useGSAP(
    () => {
      const el = ref.current;
      if (!el || value === null) return;
      const from = last.current ?? value;
      last.current = value;
      if (reducedMotion() || from === value) {
        el.textContent = format(value);
        return;
      }
      const state = { n: from };
      gsap.to(state, {
        n: value,
        duration: MOTION_DURATION,
        ease: 'power1.out',
        onUpdate: () => { el.textContent = format(state.n); },
      });
    },
    { dependencies: [value] },
  );
  return ref;
}
