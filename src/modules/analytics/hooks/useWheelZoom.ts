import { useEffect, useRef, type RefObject } from 'react';

export function useWheelZoom(ref: RefObject<HTMLElement>, enabled: boolean, onWheel: (e: WheelEvent) => void): void {
  const cb = useRef(onWheel);
  cb.current = onWheel;

  useEffect(() => {
    const el = ref.current;
    if (!enabled || !el) return;
    const handler = (e: WheelEvent) => { e.preventDefault(); cb.current(e); };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, [ref, enabled]);
}
