import type { ReactNode } from 'react';

const align = (pos: number) => (pos < 12 ? '' : pos > 88 ? '-translate-x-full' : '-translate-x-1/2');
const TONE = { dark: ['text-stone-900', 'border-stone-900'], green: ['text-[#007700]', 'border-[#007700]'] } as const;

export function Marker({ pos, label, tone = 'dark' }: { pos: number; label: ReactNode; tone?: keyof typeof TONE }) {
  const [text, line] = TONE[tone];
  return (
    <div className="absolute bottom-0 top-0" style={{ left: `${pos}%` }}>
      <span className={`absolute top-0 whitespace-nowrap text-xs font-semibold ${align(pos)} ${text}`}>{label}</span>
      <span className={`absolute -bottom-2.5 h-7 border-l-2 ${line}`} />
    </div>
  );
}

export function AxisLabel({ pos, children }: { pos: number; children: ReactNode }) {
  return <span className={`absolute whitespace-nowrap ${align(pos)}`} style={{ left: `${pos}%` }}>{children}</span>;
}
