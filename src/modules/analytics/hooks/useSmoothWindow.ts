import { useCallback, useEffect, useRef, useState } from 'react';
import { clampWin, type Win } from '../components/money/dailyData';

const EASE = 0.22;
const EPS = 0.002;

const whole = (n: number): Win => ({ s: 0, e: Math.max(0, n - 1) });
const reduced = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export function useSmoothWindow(n: number, minSpan: number) {
  const [view, setView] = useState<Win>(whole(n));
  const viewRef = useRef<Win>(whole(n));
  const target = useRef<Win>(whole(n));
  const frame = useRef(0);

  const step = (): void => {
    const v = viewRef.current;
    const t = target.current;
    const next = { s: v.s + (t.s - v.s) * EASE, e: v.e + (t.e - v.e) * EASE };
    const done = Math.abs(t.s - next.s) < EPS && Math.abs(t.e - next.e) < EPS;
    viewRef.current = done ? t : next;
    setView(viewRef.current);
    frame.current = done ? 0 : requestAnimationFrame(step);
  };

  const setTarget = useCallback((w: Win, instant = false) => {
    const t = clampWin(w, n, minSpan);
    target.current = t;
    cancelAnimationFrame(frame.current);
    if (instant || reduced()) {
      viewRef.current = t;
      setView(t);
      frame.current = 0;
      return;
    }
    frame.current = requestAnimationFrame(step);
  }, [n, minSpan]);

  const reset = useCallback(() => setTarget(whole(n)), [n, setTarget]);

  useEffect(() => {
    cancelAnimationFrame(frame.current);
    target.current = whole(n);
    viewRef.current = whole(n);
    setView(whole(n));
  }, [n]);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  return { view, target, setTarget, reset };
}
