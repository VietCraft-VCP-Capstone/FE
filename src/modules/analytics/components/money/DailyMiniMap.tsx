import { useRef, type PointerEvent } from 'react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import type { DayPoint, Win } from './dailyData';

interface Props { points: DayPoint[]; view: Win; onPan: (deltaIdx: number) => void; onJump: (center: number) => void }

export function DailyMiniMap({ points, view, onPan, onJump }: Props) {
  const n = points.length;
  const box = useRef<HTMLDivElement>(null);
  const lastX = useRef<number | null>(null);
  const width = () => box.current?.getBoundingClientRect().width || 1;

  const jump = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    onJump(((e.clientX - r.left) / r.width) * n - 0.5);
  };
  const dragStart = (e: PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    lastX.current = e.clientX;
  };
  const dragMove = (e: PointerEvent<HTMLDivElement>) => {
    if (lastX.current === null) return;
    onPan(((e.clientX - lastX.current) / width()) * n);
    lastX.current = e.clientX;
  };
  const dragEnd = () => { lastX.current = null; };

  return (
    <div ref={box} onPointerDown={jump} className="relative mt-2 h-8 select-none rounded bg-stone-50">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={points} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <XAxis dataKey="i" hide />
          <YAxis hide />
          <Bar dataKey="net" fill="#9cc9a3" isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
      <div className="absolute inset-y-0 left-0 bg-white/60" style={{ width: `${(view.s / n) * 100}%` }} />
      <div className="absolute inset-y-0 right-0 bg-white/60" style={{ width: `${((n - 1 - view.e) / n) * 100}%` }} />
      <div
        onPointerDown={dragStart}
        onPointerMove={dragMove}
        onPointerUp={dragEnd}
        onPointerCancel={dragEnd}
        className="absolute inset-y-0 cursor-grab rounded border-2 border-[#007700] bg-[#007700]/10 active:cursor-grabbing"
        style={{ left: `${(view.s / n) * 100}%`, width: `${((view.e - view.s + 1) / n) * 100}%` }}
      />
    </div>
  );
}
